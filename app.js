// ============================================================
// LAUNCH LAB NFL — DUAL FORMAT PUBLIC WEBSITE APP
//
// Supports:
//
//   NEW FORMAT
//   2026+ sanitized public JSON
//
//   LEGACY FORMAT
//   Original 2025 historical/sample JSON
//
// Ranking philosophy:
//
//   Outlook      = overall weekly player score
//   Matchup      = matchup score
//   Receiving    = receiving environment score
//   Rushing      = rushing environment score
//   TD           = touchdown environment score
//   Best Prop    = highest individual prop score
//
// Individual prop names appear ONLY in Best Prop Environments.
// ============================================================


let DATA = null;

let PLAYERS = [];

let GAMES = [];

let PLAYER_MAP = new Map();

let DATA_MODE = null;

// Presentation-only GSIS -> Sleeper ID map used for player headshots.
// Failure to load this map never blocks Launch Lab; initials remain the fallback.
let SLEEPER_ID_BY_GSIS = new Map();


const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    [
        ...document.querySelectorAll(selector)
    ];


// ============================================================
// BASIC HELPERS
// ============================================================

function fmt(value) {

    return (
        value === null
        ||
        value === undefined
        ||
        value === ""
    )
        ? "—"
        : value;
}


function round1(value) {

    if (
        value === null
        ||
        value === undefined
        ||
        value === ""
    ) {

        return "—";
    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return value;
    }


    return (
        Math.round(
            number * 10
        )
        /
        10
    );
}


// ============================================================
// SAFE NUMERIC HELPER
//
// IMPORTANT:
// Number(null) normally becomes 0 in JavaScript.
//
// That was causing missing historical Week 18 ratings to
// incorrectly display as zero.
//
// This helper preserves truly missing values as null.
// ============================================================

function numericOrNull(value) {

    if (
        value === null
        ||
        value === undefined
        ||
        value === ""
    ) {

        return null;
    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return null;
    }


    return number;
}


// ============================================================
// TEAM IMPLIED TOTAL HELPER
//
// LEGACY 2025:
// Uses the implied total already stored in the historical
// game object when available.
//
// 2026+:
// Calculates team implied total from:
//   • game total
//   • spread
//   • home / away designation
//
// IMPORTANT:
// In the 2026 public data, a POSITIVE spread_line means the
// HOME team is favored by that amount.
//
// Example:
// NO @ DET
// Total = 49.5
// spread_line = +7
//
// DET implied = (49.5 + 7) / 2 = 28.25
// NO implied  = (49.5 - 7) / 2 = 21.25
//
// No JSON or Colab change is required.
// ============================================================

function getTeamImpliedTotal(
    game,
    team,
    gamePlayers
) {

    // --------------------------------------------------------
    // LEGACY FORMAT
    //
    // Prefer the historical implied total already stored
    // inside the Week 18 game object.
    // --------------------------------------------------------

    if (
        DATA_MODE
        ===
        "LEGACY_2025"
    ) {

        const legacyTeams =
            Object.values(
                game?.teams
                ||
                {}
            );


        const legacyTeam =
            legacyTeams.find(
                item =>
                    item?.team
                    ===
                    team
            );


        const legacyImplied =
            numericOrNull(
                legacyTeam?.impliedPoints
            );


        if (
            legacyImplied
            !==
            null
        ) {

            return round1(
                legacyImplied
            );
        }
    }


    // --------------------------------------------------------
    // NEW FORMAT
    //
    // spread_line uses Launch Lab's 2026 convention:
    //
    // POSITIVE spread = HOME team favored
    // NEGATIVE spread = AWAY team favored
    //
    // home implied = (total + spread) / 2
    // away implied = (total - spread) / 2
    // --------------------------------------------------------

    const representative =
        gamePlayers.find(
            player =>
                player.team
                ===
                team
        );


    if (
        !representative
    ) {

        return null;
    }


    const total =
        numericOrNull(
            representative.gameTotal
            ??
            game?.total
        );


    const spread =
        numericOrNull(
            representative.spread
        );


    if (
        total === null
        ||
        spread === null
    ) {

        return null;
    }


    let implied =
        null;


    if (
        representative.homeAway
        ===
        "HOME"
    ) {

        implied =
            (
                total
                +
                spread
            )
            /
            2;
    }


    else if (
        representative.homeAway
        ===
        "AWAY"
    ) {

        implied =
            (
                total
                -
                spread
            )
            /
            2;
    }


    if (
        implied === null
        ||
        !Number.isFinite(
            implied
        )
    ) {

        return null;
    }


    return round1(
        implied
    );
}


function grade(score) {

    if (
        score === null
        ||
        score === undefined
        ||
        score === ""
    ) {

        return "N/A";
    }


    const s =
        Number(score);


    if (
        !Number.isFinite(s)
    ) {

        return "N/A";
    }


    if (s >= 90) return "ELITE";

    if (s >= 80) return "GREAT";

    if (s >= 70) return "GOOD";

    if (s >= 60) return "ABOVE AVG";

    if (s >= 40) return "NEUTRAL";

    if (s >= 30) return "DIFFICULT";

    if (s >= 20) return "BAD";


    return "AVOID";
}


function gclass(value = "") {

    const g =
        String(value)
        .toLowerCase();


    if (
        !g
        ||
        g === "n/a"
        ||
        g === "na"
    ) {
        return "g-neutral";
    }


    if (g.includes("elite")) {
        return "g-elite";
    }


    if (g.includes("great")) {
        return "g-great";
    }


    if (g.includes("good")) {
        return "g-good";
    }


    if (g.includes("above")) {
        return "g-above";
    }


    if (g.includes("neutral")) {
        return "g-neutral";
    }


    if (g.includes("difficult")) {
        return "g-difficult";
    }


    if (g.includes("avoid")) {
        return "g-avoid";
    }


    return "g-bad";
}


function byId(id) {

    return (
        PLAYER_MAP.get(id)
    );
}



const TEAM_COLORS = {
    ARI:"#97233F",ATL:"#A71930",BAL:"#241773",BUF:"#00338D",CAR:"#0085CA",CHI:"#0B162A",CIN:"#FB4F14",CLE:"#311D00",
    DAL:"#003594",DEN:"#FB4F14",DET:"#0076B6",GB:"#203731",HOU:"#03202F",IND:"#002C5F",JAX:"#006778",KC:"#E31837",
    LV:"#A5ACAF",LAC:"#0080C6",LA:"#003594",LAR:"#003594",MIA:"#008E97",MIN:"#4F2683",NE:"#002244",NO:"#D3BC8D",
    NYG:"#0B2265",NYJ:"#125740",PHI:"#004C54",PIT:"#FFB612",SEA:"#002244",SF:"#AA0000",TB:"#D50A0A",TEN:"#0C2340",
    WAS:"#5A1414"
};

function teamColor(team) {
    return TEAM_COLORS[String(team || "").toUpperCase()] || "#38BDF8";
}

function playerVisualHtml(player, sizeClass = "") {
    const initials=(player?.name||"?").split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("");
    const color=teamColor(player?.team);
    const sleeperId=String(player?.sleeperId ?? player?.id ?? "").trim();
    const headshotUrl=sleeperId
        ? `https://sleepercdn.com/content/nfl/players/${encodeURIComponent(sleeperId)}.jpg`
        : "";

    return `<div class="player-visual ${sizeClass}" style="--team-accent:${color}" aria-label="${player?.name||"Player"}">
        <span class="player-visual-ring"></span>
        <span class="player-visual-fallback">
            <span class="player-visual-initials">${initials}</span>
            <span class="player-visual-team">${player?.team||""}</span>
        </span>
        ${headshotUrl ? `<img class="player-headshot" src="${headshotUrl}" alt="" loading="lazy" decoding="async" onload="this.closest('.player-visual')?.classList.add('has-headshot')" onerror="this.remove()">` : ""}
    </div>`;
}

// ============================================================
// PROP HELPERS
// ============================================================

function propScore(
    player,
    propName
) {

    return Number(
        player?.props?.[propName]?.score
        ||
        0
    );
}


function receivingScore(player) {

    return Math.max(

        propScore(
            player,
            "Receiving Yards"
        ),

        propScore(
            player,
            "Receptions"
        )
    );
}


function rushingScore(player) {

    return propScore(
        player,
        "Rushing Yards"
    );
}


function passingScore(player) {

    if (
        player?.position
        !==
        "QB"
    ) {

        return 0;
    }


    return Math.max(

        propScore(
            player,
            "Passing Yards"
        ),

        propScore(
            player,
            "Passing TD"
        )
    );
}


function tdScore(player) {

    return Math.max(

        propScore(
            player,
            "TD"
        ),

        propScore(
            player,
            "Passing TD"
        ),

        propScore(
            player,
            "Receiving TD"
        ),

        propScore(
            player,
            "Rushing TD"
        )
    );
}


function hasPublicPropData() {

    return PLAYERS.some(
        player => {

            return (
                player.props
                &&
                Object.keys(
                    player.props
                ).length > 0
            );
        }
    );
}


// ============================================================
// INFORMATION / HELP TEXT
// ============================================================

const INFO_TEXT = {

    outlook:
        "Launch Lab’s overall weekly player rating. Higher scores indicate a stronger overall weekly outlook.",

    matchup:
        "How favorable the opposing defense is for this player’s position and expected usage. Higher is better.",

    opportunity:
        "How strong the player’s expected role and involvement are for the week — how much usable opportunity he is expected to receive.",

    quality:
        "The strength of the player’s underlying performance profile, helping separate pure volume from stronger underlying performance.",

    playerEnvironment:
        "How favorable the overall game conditions are for this specific player’s fantasy production.",

    gameEnvironment:
        "Launch Lab’s game-level view of how favorable this matchup is for fantasy scoring overall. Higher scores indicate stronger fantasy conditions.",

    positionMatchup:
    "The QB, RB, WR, and TE boxes show how favorable the matchup is for the offense at each position. Higher scores mean a more favorable matchup. These are ratings — not projected fantasy points or yardage."
};


function infoButtonHtml(
    key,
    label
) {

    return `
        <button
            type="button"
            class="info-btn"
            data-info-key="${key}"
            aria-label="About ${label}"
        >
            i
        </button>
    `;
}


function closeInfoPopover() {

    const popover =
        $("#infoPopover");


    if (
        !popover
    ) {

        return;
    }


    popover.classList.remove(
        "open"
    );


    popover.setAttribute(
        "aria-hidden",
        "true"
    );
}


function showInfoPopover(
    button
) {

    const popover =
        $("#infoPopover");


    if (
        !popover
    ) {

        return;
    }


    const key =
        button.dataset.infoKey;


    const text =
        INFO_TEXT[key];


    if (
        !text
    ) {

        return;
    }


    popover.textContent =
        text;


    popover.classList.add(
        "open"
    );


    popover.setAttribute(
        "aria-hidden",
        "false"
    );


    const rect =
        button.getBoundingClientRect();


    const popoverWidth =
        Math.min(
            300,
            window.innerWidth - 28
        );


    const left =
        Math.min(
            Math.max(
                14,
                rect.left
                +
                rect.width / 2
                -
                popoverWidth / 2
            ),
            window.innerWidth
            -
            popoverWidth
            -
            14
        );


    popover.style.left =
        `${left}px`;


    popover.style.top =
        `${Math.min(
            window.innerHeight - 120,
            rect.bottom + 8
        )}px`;
}


function setupInfoButtons() {

    $$(".info-btn")
    .forEach(
        button => {

            button.onclick =
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const popover =
                        $("#infoPopover");


                    const sameButtonOpen =
                        popover
                        &&
                        popover.classList.contains(
                            "open"
                        )
                        &&
                        popover.dataset.activeKey
                        ===
                        button.dataset.infoKey;


                    if (
                        sameButtonOpen
                    ) {

                        closeInfoPopover();

                        popover.dataset.activeKey =
                            "";

                        return;
                    }


                    if (
                        popover
                    ) {

                        popover.dataset.activeKey =
                            button.dataset.infoKey;
                    }


                    showInfoPopover(
                        button
                    );
                };
        }
    );
}


function setupGuideModal() {

    const modal =
        $("#launchLabGuideModal");

    const openButton =
        $("#openGuideBtn");

    const closeButton =
        $("#closeGuideBtn");


    if (
        !modal
        ||
        !openButton
    ) {

        return;
    }


    const openGuide =
        () => {

            closeInfoPopover();

            modal.classList.add(
                "open"
            );

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "guide-modal-open"
            );


            window.setTimeout(
                () => {

                    closeButton?.focus();
                },
                0
            );
        };


    const closeGuide =
        () => {

            modal.classList.remove(
                "open"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.classList.remove(
                "guide-modal-open"
            );

            openButton.focus();
        };


    openButton.onclick =
        openGuide;


    if (
        closeButton
    ) {

        closeButton.onclick =
            closeGuide;
    }


    $$('[data-guide-close]')
    .forEach(
        element => {

            element.onclick =
                closeGuide;
        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key
                ===
                "Escape"
            ) {

                if (
                    modal.classList.contains(
                        "open"
                    )
                ) {

                    closeGuide();
                }


                closeInfoPopover();
            }
        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".info-btn"
                )
                &&
                !event.target.closest(
                    "#infoPopover"
                )
            ) {

                closeInfoPopover();
            }
        }
    );


    window.addEventListener(
        "resize",
        closeInfoPopover
    );


    window.addEventListener(
        "scroll",
        closeInfoPopover,
        true
    );
}


// ============================================================
// SCHEMA DETECTION
// ============================================================

function detectDataMode(data) {

    // NEW SANITIZED FORMAT

    if (
        Array.isArray(
            data?.players
        )
        &&
        data.players.length > 0
        &&
        (
            "player_name"
            in
            data.players[0]
        )
    ) {

        return "PUBLIC_V2";
    }


    // LEGACY FORMAT

    if (
        Array.isArray(
            data?.players
        )
        &&
        data.players.length > 0
        &&
        (
            "name"
            in
            data.players[0]
        )
    ) {

        return "LEGACY_2025";
    }


    return "UNKNOWN";
}


// ============================================================
// NEW FORMAT NORMALIZER
// ============================================================

function normalizePublicPlayer(raw) {

    return {

        id:
            raw.player_id,

        // Public Launch Lab IDs are GSIS IDs. Resolve the Sleeper ID only
        // in the presentation layer so model/public JSON contracts stay untouched.
        sleeperId:
            SLEEPER_ID_BY_GSIS.get(String(raw.player_id || "")) || null,

        name:
            raw.player_name,

        team:
            raw.team,

        opponent:
            raw.opponent,

        position:
            raw.position,

        homeAway:
            raw.home_away,

        gameDate:
            raw.game_date,

        gameTime:
            raw.game_time,

        gameTotal:
            raw.game_total,

        spread:
            raw.spread_line,

        role:
            raw.role,

        roleStatus:
            raw.role_status,

        roleConfidence:
            raw.role_confidence,

        roleSource:
            raw.role_source,

        v1:
            raw.model_score_v1,

        v1Grade:
            raw.model_grade_v1,

        outlook:
            raw.model_score_v2,

        outlookGrade:
            raw.model_grade_v2,

        matchup:
            raw.matchup_rating,

        matchupGrade:
            grade(
                raw.matchup_rating
            ),

        opportunity:
            raw.opportunity_rating,

        opportunityGrade:
            grade(
                raw.opportunity_rating
            ),

        quality:
            raw.quality_rating,

        qualityGrade:
            grade(
                raw.quality_rating
            ),

        gameEnvironment:
            raw.game_environment_rating,

        gameEnvironmentGrade:
            grade(
                raw.game_environment_rating
            ),

        positionRank:
            raw.position_rank,

        overallRank:
            raw.overall_rank,

        modelTrust:
            raw.model_trust,

        dataConfidence:
            raw.data_confidence,

        confidenceBadge:
            raw.confidence_badge,

        modelReadiness:
            raw.model_readiness,

        scoreDataStatus:
            raw.score_data_status,

        headlineEligible:
            (
                raw.headline_eligible
                ===
                true
            ),

        displayGroup:
            raw.display_group,

        changedTeam:
            (
                raw.changed_team
                ===
                true
            ),

        positionChangeReview:
            (
                raw.position_change_review
                ===
                true
            ),

        rosterStatus:
            raw.roster_status,

        season:
            raw.season,

        week:
            raw.week,

        siteState:
            raw.site_state,

        modelVersion:
            raw.model_version,

        scoreScaleLabel:
            raw.score_scale_label,

        scoreExplanation:
            raw.score_explanation,

        seasonContext:
            raw.season_context,

        props:
            raw.props
            ||
            {},

        bestProp:
            raw.best_prop
            ??
            raw.bestProp
            ??
            null,

        bestPropScore:
            raw.best_prop_score
            ??
            raw.bestPropScore
            ??
            null,

        why:
            [],

        actualPpr:
            null
    };
}


// ============================================================
// LEGACY FORMAT NORMALIZER
// ============================================================

function normalizeLegacyPlayer(raw) {

    return {

        id:
            raw.id,

        name:
            raw.name,

        team:
            raw.team,

        opponent:
            raw.opponent,

        position:
            raw.position,

        homeAway:
            raw.homeAway,

        gameDate:
            raw.gameDate
            ||
            null,

        gameTime:
            raw.gameTime
            ||
            null,

        gameTotal:
            raw.gameTotal
            ??
            null,

        spread:
            raw.spread
            ??
            null,

        role:
            raw.role
            ||
            null,

        roleStatus:
            raw.roleStatus
            ||
            "LEGACY_SAMPLE",

        roleConfidence:
            raw.roleConfidence
            ||
            null,

        roleSource:
            "LEGACY_SAMPLE",

        v1:
            raw.v1,

        v1Grade:
            grade(
                raw.v1
            ),

        outlook:
            raw.outlook,

        outlookGrade:
            raw.outlookGrade
            ||
            grade(
                raw.outlook
            ),

        matchup:
            raw.matchup,

        matchupGrade:
            raw.matchupGrade
            ||
            grade(
                raw.matchup
            ),

        opportunity:
            raw.opportunity
            ??
            null,

        opportunityGrade:
            raw.opportunityGrade
            ||
            (
                raw.opportunity !== null
                &&
                raw.opportunity !== undefined
                    ?
                    grade(
                        raw.opportunity
                    )
                    :
                    "N/A"
            ),

        quality:
            raw.quality
            ??
            null,

        qualityGrade:
            raw.qualityGrade
            ||
            (
                raw.quality !== null
                &&
                raw.quality !== undefined
                    ?
                    grade(
                        raw.quality
                    )
                    :
                    "N/A"
            ),

        gameEnvironment:
            raw.gameEnvironment
            ??
            raw.gameEnvironmentScore
            ??
            null,

        gameEnvironmentGrade:
            raw.gameEnvironmentGrade
            ||
            (
                raw.gameEnvironment !== null
                &&
                raw.gameEnvironment !== undefined
                    ?
                    grade(
                        raw.gameEnvironment
                    )
                    :
                    "N/A"
            ),

        positionRank:
            raw.positionRank
            ??
            null,

        overallRank:
            raw.overallRank
            ??
            null,

        modelTrust:
            "HISTORICAL_SAMPLE",

        dataConfidence:
            "HISTORICAL_SAMPLE",

        confidenceBadge:
            "Historical Sample",

        modelReadiness:
            "HISTORICAL_SAMPLE",

        scoreDataStatus:
            "HISTORICAL_SAMPLE",

        headlineEligible:
            true,

        displayGroup:
            "HEADLINE",

        changedTeam:
            false,

        positionChangeReview:
            false,

        rosterStatus:
            "HISTORICAL",

        season:
            raw.season
            ??
            2025,

        week:
            raw.week
            ??
            18,

        siteState:
            "HISTORICAL_SAMPLE",

        modelVersion:
            "V2",

        scoreScaleLabel:
            "Launch Lab Rating",

        scoreExplanation:
            "Historical Launch Lab rating.",

        seasonContext:
            "Historical Launch Lab weekly output.",

        props:
            raw.props
            ||
            {},

        bestProp:
            raw.bestProp
            ??
            null,

        bestPropScore:
            raw.bestPropScore
            ??
            null,

        why:
            raw.why
            ||
            [],

        actualPpr:
            raw.actualPpr
            ??
            null
    };
}
// ============================================================
// BUILD GAMES FOR NEW FORMAT
// ============================================================

function buildPublicGames(players) {

    const gameMap =
        new Map();


    players.forEach(
        player => {

            if (
                !player.team
                ||
                !player.opponent
            ) {

                return;
            }


            // --------------------------------------------------------
            // DETERMINE TRUE AWAY / HOME ORDER
            // --------------------------------------------------------

            const awayTeam =
                player.homeAway === "AWAY"
                    ? player.team
                    : player.opponent;


            const homeTeam =
                player.homeAway === "HOME"
                    ? player.team
                    : player.opponent;


            // --------------------------------------------------------
            // GAME KEY
            //
            // Use a stable team combination for identifying the game.
            // The display order is stored separately as awayTeam/homeTeam.
            // --------------------------------------------------------

            const gameTeamsForKey =
                [
                    player.team,
                    player.opponent
                ]
                .sort();


            const gameKey =
                `${
                    player.gameDate || ""
                }_${
                    gameTeamsForKey.join("_")
                }`;


            // --------------------------------------------------------
            // CREATE GAME ONCE
            // --------------------------------------------------------

            if (
                !gameMap.has(
                    gameKey
                )
            ) {

                gameMap.set(
                    gameKey,
                    {

                        id:
                            gameKey,

                        teams:
                            new Set(),

                        awayTeam:
                            awayTeam,

                        homeTeam:
                            homeTeam,

                        players:
                            [],

                        gameDate:
                            player.gameDate,

                        gameTime:
                            player.gameTime,

                        total:
                            player.gameTotal,

                        environmentValues:
                            []
                    }
                );
            }


            // --------------------------------------------------------
            // GET EXISTING GAME
            // --------------------------------------------------------

            const game =
                gameMap.get(
                    gameKey
                );


            // --------------------------------------------------------
            // PRESERVE TRUE AWAY / HOME INFORMATION
            //
            // If a later player row contains an explicit designation,
            // keep the game object synchronized with it.
            // --------------------------------------------------------

            if (
                player.homeAway
                ===
                "AWAY"
            ) {

                game.awayTeam =
                    player.team;

                game.homeTeam =
                    player.opponent;
            }


            else if (
                player.homeAway
                ===
                "HOME"
            ) {

                game.homeTeam =
                    player.team;

                game.awayTeam =
                    player.opponent;
            }


            // --------------------------------------------------------
            // ADD TEAMS / PLAYER
            // --------------------------------------------------------

            game.teams.add(
                player.team
            );


            game.teams.add(
                player.opponent
            );


            game.players.push(
                player.id
            );


            // --------------------------------------------------------
            // GAME ENVIRONMENT INPUT
            // --------------------------------------------------------

            const numericEnvironment =
                numericOrNull(
                    player.gameEnvironment
                );


            if (
                player.headlineEligible
                &&
                numericEnvironment !== null
            ) {

                game.environmentValues.push(
                    numericEnvironment
                );
            }
        }
    );


    // ============================================================
    // FINALIZE GAMES
    // ============================================================

    return (
        [
            ...gameMap.values()
        ]

        .map(
            game => {

                // ----------------------------------------------------
                // DISPLAY ORDER MUST ALWAYS BE:
                //
                // AWAY @ HOME
                // ----------------------------------------------------

                const teams =
                    [
                        game.awayTeam,
                        game.homeTeam
                    ]
                    .filter(Boolean);


                // ----------------------------------------------------
                // FALLBACK
                //
                // Only used if home/away is missing for some future
                // dataset. This prevents the page from breaking.
                // ----------------------------------------------------

                if (
                    teams.length
                    < 2
                ) {

                    const fallbackTeams =
                        [
                            ...game.teams
                        ];

                    game.awayTeam =
                        game.awayTeam
                        ||
                        fallbackTeams[0]
                        ||
                        null;

                    game.homeTeam =
                        game.homeTeam
                        ||
                        fallbackTeams[1]
                        ||
                        null;
                }


                // ----------------------------------------------------
                // GAME ENVIRONMENT SCORE
                // ----------------------------------------------------

                const environmentScore =
                    game.environmentValues.length
                        ?
                        (
                            game.environmentValues.reduce(
                                (a, b) =>
                                    a + b,
                                0
                            )
                            /
                            game.environmentValues.length
                        )
                        :
                        null;


                game.environmentScore =
                    environmentScore !== null
                        ?
                        (
                            Math.round(
                                environmentScore
                                *
                                10
                            )
                            /
                            10
                        )
                        :
                        null;


                game.environmentGrade =
                    environmentScore !== null
                        ?
                        grade(
                            game.environmentScore
                        )
                        :
                        "N/A";


                // ----------------------------------------------------
                // TRUE MATCHUP LABEL
                // ----------------------------------------------------

                game.matchupLabel =
                    (
                        game.awayTeam
                        &&
                        game.homeTeam
                    )
                        ?
                        `${game.awayTeam} @ ${game.homeTeam}`
                        :
                        [
                            ...game.teams
                        ]
                        .join(
                            " @ "
                        );


                return game;
            }
        )


        // ------------------------------------------------------------
        // CHRONOLOGICAL WEEK ORDER
        // ------------------------------------------------------------

        .sort(
            (a, b) => {

                if (
                    a.gameDate
                    !==
                    b.gameDate
                ) {

                    return (
                        String(
                            a.gameDate
                        )
                        .localeCompare(
                            String(
                                b.gameDate
                            )
                        )
                    );
                }


                return (
                    String(
                        a.gameTime
                    )
                    .localeCompare(
                        String(
                            b.gameTime
                        )
                    )
                );
            }
        )
    );
}

// ============================================================
// BUILD LEGACY GAMES
// ============================================================

function buildLegacyGames(data) {

    if (
        Array.isArray(
            data.games
        )
        &&
        data.games.length
    ) {

        return data.games;
    }


    return (
        buildPublicGames(
            PLAYERS
        )
    );
}


// ============================================================
// INITIALIZE
// ============================================================

async function loadHeadshotCrosswalk() {
    const url = "https://cdn.jsdelivr.net/gh/antonwilms/sleeper-dashboard-data@main/nflverse/playerids.json";

    try {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Headshot crosswalk HTTP ${response.status}`);

        const payload = await response.json();
        const ids = payload?.ids || {};

        SLEEPER_ID_BY_GSIS = new Map(
            Object.entries(ids)
                .filter(([, value]) => value?.sleeperId)
                .map(([gsisId, value]) => [String(gsisId), String(value.sleeperId)])
        );

        console.info(`Launch Lab headshot crosswalk loaded: ${SLEEPER_ID_BY_GSIS.size} IDs`);
    } catch (error) {
        SLEEPER_ID_BY_GSIS = new Map();
        console.warn("Launch Lab headshots unavailable; using initials fallback.", error);
    }
}


// ============================================================
// START APPLICATION
// ============================================================

async function init() {

    try {
        // Headshots are cosmetic. Awaiting the crosswalk ensures normalized
        // players receive the correct Sleeper ID, while failure safely falls
        // back to the existing initials UI.
        await loadHeadshotCrosswalk();

        const indexResponse =
    await fetch(
        "data/index.json",
        {
            cache: "no-store"
        }
    );


        if (
            !indexResponse.ok
        ) {

            throw new Error(
                "Could not load data/index.json"
            );
        }


        const index =
            await indexResponse.json();


        const weekSelect =
            $("#weekSelect");


        weekSelect.innerHTML =
            "";


        const availableWeeks =
            (
                index.available_weeks
                ||
                index.weeks
                ||
                []
            );


        availableWeeks.forEach(
            week => {

                const label =
                    (
                        week.label
                        ||
                        `${week.season} Week ${week.week}`
                    );


                const file =
                    (
                        week.week_file
                        ||
                        week.file
                    );


                if (
                    file
                ) {

                    weekSelect.add(

                        new Option(
                            label,
                            file
                        )
                    );
                }
            }
        );


        const currentFile =

            index.current?.week_file

            ||

            index.default

            ||

            availableWeeks[0]?.week_file

            ||

            availableWeeks[0]?.file;


        if (
            !currentFile
        ) {

            throw new Error(
                "No current week file found."
            );
        }


        weekSelect.value =
            currentFile;


        weekSelect.onchange =
            () => {

                loadWeek(
                    weekSelect.value
                );
            };


        await loadWeek(
            currentFile
        );


        setupNav();

        setupGuideModal();

    }

    catch (error) {

        console.error(
            error
        );


        if (
            $("#games")
        ) {

            $("#games").innerHTML =
                `
                <div class="privacy-note">
                    Unable to load Launch Lab data.
                    Please refresh the page.
                </div>
                `;
        }
    }
}


// ============================================================
// LOAD WEEK
// ============================================================

async function loadWeek(file) {

    const response =
    await fetch(
        "data/" + file,
        {
            cache: "no-store"
        }
    );


    if (
        !response.ok
    ) {

        throw new Error(
            `Could not load ${file}`
        );
    }


    DATA =
        await response.json();


    DATA_MODE =
        detectDataMode(
            DATA
        );


    if (
        DATA_MODE
        ===
        "PUBLIC_V2"
    ) {

        PLAYERS =
            (
                DATA.players
                ||
                []
            )

            .map(
                normalizePublicPlayer
            );


        GAMES =
            buildPublicGames(
                PLAYERS
            );
    }


    else if (
        DATA_MODE
        ===
        "LEGACY_2025"
    ) {

        PLAYERS =
            (
                DATA.players
                ||
                []
            )

            .map(
                normalizeLegacyPlayer
            );


        GAMES =
            buildLegacyGames(
                DATA
            );
    }


    else {

        throw new Error(
            "Unsupported Launch Lab JSON structure."
        );
    }


    PLAYER_MAP =
        new Map(

            PLAYERS.map(
                player => [

                    player.id,
                    player
                ]
            )
        );


    updateDataStatus();


    renderQuick();


    renderGames();


    renderRankings(
        hasPublicPropData()
            ? "td"
            : "outlook"
    );


    renderPerformance();
}


// ============================================================
// DATA STATUS
// ============================================================

function updateDataStatus() {

    const dataStatus =
        $("#dataStatus");


    if (
        !dataStatus
    ) {

        return;
    }


    if (
        DATA_MODE
        ===
        "PUBLIC_V2"
    ) {

        const meta =
            DATA.meta
            ||
            {};


        dataStatus.textContent =
            (
                meta.site_state
                ===
                "EARLY_SEASON_PREVIEW"
            )
                ?
                (
                    `${meta.season || 2026} `
                    +
                    `Week ${meta.week || 1} `
                    +
                    "— Early Season Preview"
                )
                :
                (
                    `${meta.season} Week ${meta.week}`
                );


        return;
    }


    dataStatus.textContent =
        (
            DATA.meta?.label
            ||
            "Historical Week"
        );
}


// ============================================================
// QUICK SUMMARY
// ============================================================

function renderQuick() {

    const headlinePlayers =
        PLAYERS.filter(
            player =>
                player.headlineEligible
        );


    const games =
        [
            ...GAMES
        ];


    const tdPlayers =
        headlinePlayers

        .map(
            player => [
                player,
                tdScore(player)
            ]
        )

        .filter(
            ([, score]) =>
                Number.isFinite(score)
                &&
                score > 0
        )

        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    const passingPlayers =
        headlinePlayers

        .filter(
            player =>
                player.position === "QB"
        )

        .map(
            player => [
                player,
                passingScore(player)
            ]
        )

        .filter(
            ([, score]) =>
                Number.isFinite(score)
                &&
                score > 0
        )

        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    if (
        $("#bestGame")
    ) {

        let game =
            games[0];


        if (
            DATA_MODE
            ===
            "LEGACY_2025"
        ) {

            games.sort(
                (a, b) =>
                    (
                        Number(
                            b.total
                            ||
                            0
                        )
                        -
                        Number(
                            a.total
                            ||
                            0
                        )
                    )
            );


            game =
                games[0];
        }


        $("#bestGame").textContent =
            game
                ?
                (
                    `${game.matchupLabel} · `
                    +
                    `${fmt(
                        game.environmentGrade
                    )}`
                )
                :
                "—";
    }


    if (
        $("#topTD")
    ) {

        $("#topTD").textContent =
            tdPlayers[0]
                ?
                (
                    `${tdPlayers[0][0].name} · `
                    +
                    `${round1(
                        tdPlayers[0][1]
                    )}`
                )
                :
                "—";
    }


    if (
        $("#topPassing")
    ) {

        $("#topPassing").textContent =
            passingPlayers[0]
                ?
                (
                    `${passingPlayers[0][0].name} · `
                    +
                    `${round1(
                        passingPlayers[0][1]
                    )}`
                )
                :
                "—";
    }
}
// ============================================================
// GAME BOARD
// ============================================================

function renderGames() {

    const search =
        (
            $("#search")?.value
            ||
            ""
        )
        .toLowerCase();


    const position =
        (
            $("#positionFilter")?.value
            ||
            "ALL"
        );


    const minScore =
        Number(
            $("#minScore")?.value
            ||
            0
        );


    let html =
        "";


    GAMES.forEach(
        game => {

            let gamePlayers =
                (
                    game.players
                    ||
                    []
                )

                .map(
                    item => {

                        if (
                            typeof item
                            ===
                            "object"
                        ) {

                            return (
                                byId(
                                    item.id
                                )
                                ||
                                item
                            );
                        }


                        return (
                            byId(
                                item
                            )
                        );
                    }
                )

                .filter(
                    Boolean
                );


            if (
                !gamePlayers.length
                &&
                DATA_MODE
                ===
                "LEGACY_2025"
            ) {

                const parts =
                    (
                        game.matchupLabel
                        ||
                        ""
                    )

                    .split("@")

                    .map(
                        item =>
                            item.trim()
                    );


                gamePlayers.push(

                    ...PLAYERS.filter(
                        player =>
                            parts.includes(
                                player.team
                            )
                    )
                );
            }


            const visible =
                gamePlayers.some(
                    player => {

                        return (
                            (
                                position
                                ===
                                "ALL"
                                ||
                                player.position
                                ===
                                position
                            )
                            &&
                            (
                                Number(
                                    player.outlook
                                    ||
                                    0
                                )
                                >=
                                minScore
                            )
                            &&
                            (
                                !search
                                ||
                                player.name
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                                ||
                                player.team
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                                ||
                                player.opponent
                                    .toLowerCase()
                                    .includes(
                                        search
                                    )
                            )
                        );
                    }
                );


            if (
                !visible
            ) {

                return;
            }


            const awayTeam =
    gamePlayers.find(
        player =>
            player.homeAway === "AWAY"
    )?.team;

const homeTeam =
    gamePlayers.find(
        player =>
            player.homeAway === "HOME"
    )?.team;

const teams =
    [
        awayTeam,
        homeTeam
    ]
    .filter(Boolean);


            const environmentScore =
                numericOrNull(
                    game.environmentScore
                );


            const environmentGrade =
                (
                    game.environmentGrade
                    &&
                    game.environmentGrade !== "N/A"
                )
                    ?
                    game.environmentGrade
                    :
                    (
                        environmentScore !== null
                            ?
                            grade(
                                environmentScore
                            )
                            :
                            "N/A"
                    );


            const matchupLabel =
                (
                    game.matchupLabel
                    ||
                    teams.join(
                        " @ "
                    )
                );


            const impliedTotals =
                teams

                .map(
                    team => {

                        const implied =
                            getTeamImpliedTotal(
                                game,
                                team,
                                gamePlayers
                            );


                        if (
                            implied === null
                            ||
                            implied === undefined
                            ||
                            implied === "—"
                        ) {

                            return "";
                        }


                        return `
                            <span class="pill">
                                ${team} implied ${implied}
                            </span>
                        `;
                    }
                )

                .join("");


            html += `

            <article class="game-card">

                <div class="game-summary">

                    <div class="game-top">

                        <div>

                            <div class="matchup">

    <span>
        ${matchupLabel}
    </span>

    <span
        class="material-symbols-rounded expand-chevron game-chevron"
        aria-hidden="true"
    >
        expand_more
    </span>

</div>

                            <div class="game-meta">

                                ${
                                    game.gameDate
                                        ?
                                        `
                                        <span class="pill">
                                            ${fmt(
                                                game.gameDate
                                            )}
                                        </span>
                                        `
                                        :
                                        ""
                                }

                                ${
                                    game.gameTime
                                        ?
                                        `
                                        <span class="pill">
                                            ${fmt(
                                                game.gameTime
                                            )}
                                        </span>
                                        `
                                        :
                                        ""
                                }

                                <span class="pill">
                                    Total ${
                                        fmt(
                                            game.total
                                        )
                                    }
                                </span>

                                ${impliedTotals}

                            </div>

                        </div>


                        <div>

                            <div
                                class="
                                    score
                                    ${
                                        gclass(
                                            environmentGrade
                                        )
                                    }
                                "
                            >

                                ${
                               DATA_MODE
===
"PUBLIC_V2"
    ?
    (
        environmentScore !== null
            ?
            `
            <span class="score-number">
                ${round1(
                    environmentScore
                )}/100
            </span>

            <span class="score-grade-label">
                ${environmentGrade}
            </span>
            `
            :
            "—"
    )
    :
    fmt(
        environmentGrade
    )
                                }

                            </div>


                            <div class="player-sub info-label">

                                Game Environment

                                ${infoButtonHtml(
                                    "gameEnvironment",
                                    "Game Environment"
                                )}

                            </div>

                        </div>

                    </div>

                </div>


                <div class="expand">

                    <div class="teams">

                        ${
                            teams

                            .map(
                                team =>
                                    renderTeam(
                                        team,
                                        gamePlayers,
                                        position,
                                        minScore,
                                        search
                                    )
                            )

                            .join("")
                        }

                    </div>

                </div>

            </article>
            `;
        }
    );


    $("#games").innerHTML =
        html
        ||
        `
        <div class="privacy-note">
            No games match the current filters.
        </div>
        `;


   $$(".game-summary")
.forEach(
    element => {

        element.onclick =
            () => {

                const gameCard =
                    element
                    .parentElement;


                const isOpen =
                    gameCard
                    .classList
                    .toggle(
                        "open"
                    );


                element
                    .classList
                    .toggle(
                        "is-open",
                        isOpen
                    );
            };
    }
);


    $$(".posbtn")
.forEach(
    element => {

        element.onclick =
            () => {

                const playerList =
                    element
                    .nextElementSibling;


                const isOpen =
                    playerList
                    .classList
                    .toggle(
                        "open"
                    );


                element
                    .classList
                    .toggle(
                        "is-open",
                        isOpen
                    );
            };
    }
);


    $$(".detail-btn")
    .forEach(
        element => {

            element.onclick =
                () => {

                    element
                    .nextElementSibling
                    .classList
                    .toggle(
                        "open"
                    );
                };
        }
    );


    setupInfoButtons();
}


// ============================================================
// TEAM DISPLAY
// ============================================================

function renderTeam(
    team,
    gamePlayers,
    positionFilter,
    minScore,
    search
) {

    const teamPlayers =
        gamePlayers.filter(
            player =>
                player.team
                ===
                team
        );


    const opponent =
        teamPlayers[0]?.opponent
        ||
        "";


    // ========================================================
    // SAFE TEAM ENVIRONMENT HANDLING
    // ========================================================

    const environmentValues =
        teamPlayers

        .map(
            player =>
                numericOrNull(
                    player.gameEnvironment
                )
        )

        .filter(
            value =>
                value !== null
        );


    const environmentScore =
        environmentValues.length
            ?
            (
                environmentValues.reduce(
                    (a, b) =>
                        a + b,
                    0
                )
                /
                environmentValues.length
            )
            :
            null;


    const historicalEnvironmentGrades =
        teamPlayers

        .map(
            player =>
                player.gameEnvironmentGrade
        )

        .filter(
            value => {

                return (
                    value !== null
                    &&
                    value !== undefined
                    &&
                    value !== ""
                    &&
                    value !== "N/A"
                );
            }
        );


    const environmentGrade =
        environmentScore !== null
            ?
            grade(
                environmentScore
            )
            :
            (
                historicalEnvironmentGrades[0]
                ||
                "N/A"
            );


    const attack =
        [
            "QB",
            "RB",
            "WR",
            "TE"
        ]

        .map(
            pos => {

                const matchupValues =
                    teamPlayers

                    .filter(
                        player =>
                            player.position
                            ===
                            pos
                    )

                    .map(
                        player =>
                            numericOrNull(
                                player.matchup
                            )
                    )

                    .filter(
                        value =>
                            value !== null
                    );


                const score =
                    matchupValues.length
                        ?
                        (
                            matchupValues.reduce(
                                (a, b) =>
                                    a + b,
                                0
                            )
                            /
                            matchupValues.length
                        )
                        :
                        null;


                return `

                <div class="attack">

    <span>
        ${pos}
    </span>

    <strong
        class="
            ${
                gclass(
                    grade(
                        score
                    )
                )
            }
        "
    >
        ${
            score === null
                ?
                "—"
                :
                `
                <span class="score-number">
                    ${round1(
                        score
                    )}/100
                </span>

                <span class="score-grade-label">
                    ${grade(
                        score
                    )}
                </span>
                `
        }
    </strong>

</div>
                `;
            }
        )

        .join("");


    const sections =
        [
            "QB",
            "RB",
            "WR",
            "TE"
        ]

        .filter(
            pos =>
                positionFilter
                ===
                "ALL"
                ||
                pos
                ===
                positionFilter
        )

        .map(
            pos => {

                const players =
                    teamPlayers

                    .filter(
                        player => {

                            return (
                                player.position
                                ===
                                pos
                                &&
                                Number(
                                    player.outlook
                                    ||
                                    0
                                )
                                >=
                                minScore
                                &&
                                (
                                    !search
                                    ||
                                    player.name
                                        .toLowerCase()
                                        .includes(
                                            search
                                        )
                                    ||
                                    player.team
                                        .toLowerCase()
                                        .includes(
                                            search
                                        )
                                    ||
                                    player.opponent
                                        .toLowerCase()
                                        .includes(
                                            search
                                        )
                                )
                            );
                        }
                    )

                   .sort(
    (a, b) => {

        // ========================================================
        // WEEKLY BOARD DISPLAY ORDER
        //
        // Sort players by CURRENT DEPTH-CHART ROLE first:
        //
        // QB1 -> QB2 -> QB3
        // RB1 -> RB2 -> RB3
        // WR1 -> WR2 -> WR3
        // TE1 -> TE2 -> TE3
        //
        // If two players have the same role, or their role cannot
        // be parsed, use Launch Lab Outlook as the tie-breaker.
        //
        // IMPORTANT:
        // This changes DISPLAY ORDER ONLY.
        // It does NOT change any Launch Lab model score,
        // opportunity score, quality score, matchup score,
        // prop score, or Rankings-page ordering.
        // ========================================================

        const getDepthRank =
            player => {

                const role =
                    String(
                        player.role
                        ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                const match =
                    role.match(
                        /^(QB|RB|WR|TE)(\d+)$/
                    );


                if (
                    !match
                ) {

                    return 999;
                }


                return Number(
                    match[2]
                );
            };


        const aDepth =
            getDepthRank(
                a
            );


        const bDepth =
            getDepthRank(
                b
            );


        // --------------------------------------------------------
        // PRIMARY SORT:
        // Current depth-chart role
        // --------------------------------------------------------

        if (
            aDepth
            !==
            bDepth
        ) {

            return (
                aDepth
                -
                bDepth
            );
        }


        // --------------------------------------------------------
        // SECONDARY SORT:
        // Launch Lab Outlook, highest first
        // --------------------------------------------------------

        const outlookDifference =
            Number(
                b.outlook
                ||
                0
            )
            -
            Number(
                a.outlook
                ||
                0
            );


        if (
            outlookDifference
            !==
            0
        ) {

            return outlookDifference;
        }


        // --------------------------------------------------------
        // FINAL TIE-BREAKER:
        // Alphabetical player name
        // --------------------------------------------------------

        return String(
            a.name
            ||
            ""
        )
        .localeCompare(
            String(
                b.name
                ||
                ""
            )
        );
    }
);


                if (
                    !players.length
                ) {

                    return "";
                }


                return `

                <button class="posbtn">

    <span>
        ${pos} · ${players.length} players
    </span>

    <span
        class="material-symbols-rounded expand-chevron"
        aria-hidden="true"
    >
        expand_more
    </span>

</button>


                <div class="player-list">

                    ${
                        players
                        .map(
                            renderPlayer
                        )
                        .join("")
                    }

                </div>
                `;
            }
        )

        .join("");


    return `

    <div class="team">

        <div class="team-title">

            <div>

                <strong>
                    ${team}
                </strong>

                <div class="player-sub">
                    vs ${opponent}
                </div>

            </div>


            <div>

                <div
                    class="
                        score
                        small
                        ${
                            gclass(
                                environmentGrade
                            )
                        }
                    "
                >
                 ${
    DATA_MODE
    ===
    "PUBLIC_V2"
        ?
        (
            environmentScore !== null
                ?
                `
                <span class="score-number">
                    ${round1(
                        environmentScore
                    )}/100
                </span>

                <span class="score-grade-label">
                    ${environmentGrade}
                </span>
                `
                :
                "—"
        )
        :
        environmentGrade
}
                </div>

                <div class="player-sub">
                    Environment
                </div>

            </div>

        </div>


       <div class="player-sub info-label matchup-heading">

    How favorable is this matchup?

    ${infoButtonHtml(
        "positionMatchup",
        "Position Matchup Ratings"
    )}

</div>


<div class="player-sub matchup-helper">
    Higher scores = more favorable for the offense.
</div>


<div class="attack-grid">
    ${attack}
</div>


        ${sections}

    </div>
    `;
}


// ============================================================
// PLAYER DISPLAY
// ============================================================

function renderPlayer(player) {

    const metrics = [

        [
            "Outlook V2",
            player.outlook,
            player.outlookGrade,
            "outlook"
        ],

        [
            "Matchup",
            player.matchup,
            player.matchupGrade,
            "matchup"
        ],

        [
            "Opportunity",
            player.opportunity,
            player.opportunityGrade,
            "opportunity"
        ],

        [
            "Quality",
            player.quality,
            player.qualityGrade,
            "quality"
        ],

        [
            "Game Env",
            player.gameEnvironment,
            player.gameEnvironmentGrade,
            "playerEnvironment"
        ]

    ]

    .map(
        metric => {

            const numeric =
                numericOrNull(
                    metric[1]
                );


            const hasNumeric =
                numeric !== null;


            const displayValue =
                hasNumeric
                    ?
                    (
                        DATA_MODE
                        ===
                        "PUBLIC_V2"
                            ?
                            `${round1(
                                numeric
                            )}/100`
                            :
                            round1(
                                numeric
                            )
                    )
                    :
                    fmt(
                        metric[2]
                    );


            return `

            <div class="metric">

                <span class="info-label">

                    ${metric[0]}

                    ${infoButtonHtml(
                        metric[3],
                        metric[0]
                    )}

                </span>

                <strong
    class="
        ${
            gclass(
                metric[2]
            )
        }
    "
>
    <span class="score-number">
        ${displayValue}
    </span>

    ${
        DATA_MODE
        ===
        "PUBLIC_V2"
            ?
            `
            <span class="score-grade-label">
                ${fmt(
                    metric[2]
                )}
            </span>
            `
            :
            ""
    }
</strong>

            </div>
            `;
        }
    )

    .join("");


    let propsHtml =
        "";


    if (
        player.props
        &&
        Object.keys(
            player.props
        ).length
    ) {

        propsHtml =
            Object.entries(
                player.props
            )

            .map(
                ([key, value]) => `

                   <div class="prop">

    <span>
        ${key}
    </span>

    <strong
        class="
            ${
                gclass(
                    value.grade
                )
            }
        "
    >
        <span class="score-number">
            ${fmt(
                value.score
            )}/100
        </span>

        <span class="score-grade-label">
            ${fmt(
                value.grade
            )}
        </span>
    </strong>

</div>
                `
            )

            .join("");
    }


    const confidence =
        player.confidenceBadge
        ||
        "Early Season";


    return `

    <div class="player">

        <div class="player-head">

            <div>

                <div class="player-name">
                    ${player.name}
                </div>


                <div class="player-sub">

                    ${player.team}
                    ${player.position}

                    ${
                        player.role
                            ?
                            `· ${player.role}`
                            :
                            ""
                    }

                    · vs ${player.opponent}

                </div>


                <div
                    style="
                        display:flex;
                        gap:6px;
                        flex-wrap:wrap;
                        margin-top:6px;
                    "
                >

                    <span class="pill">
                        ${confidence}
                    </span>

                </div>

            </div>


            <div>

                <div
                    class="
                        score
                        ${
                            gclass(
                                player.outlookGrade
                            )
                        }
                    "
                >
                    ${
    DATA_MODE
    ===
    "PUBLIC_V2"
        ?
        `
        <span class="score-number">
            ${round1(
                player.outlook
            )}/100
        </span>

        <span class="score-grade-label">
            ${fmt(
                player.outlookGrade
            )}
        </span>
        `
        :
        fmt(
            player.outlook
        )
}
                </div>


                <div class="player-sub">
                    Player Outlook
                </div>

            </div>

        </div>


        ${
            DATA_MODE
            ===
            "PUBLIC_V2"
                ?
                `
                <div
                    class="player-sub"
                    style="
                        margin-top:8px;
                        margin-bottom:8px;
                    "
                >
                    Overall weekly Launch Lab rating.
                    Ratings use a 0–100 scale and are not
                    projected yards or fantasy points.
                </div>
                `
                :
                ""
        }


        <div class="metric-grid">
            ${metrics}
        </div>


        ${
            propsHtml
                ?
                `
                <div class="prop-grid">
                    ${propsHtml}
                </div>
                `
                :
                ""
        }


        <button class="detail-btn">
            Rating details / Advanced view ▾
        </button>


        <div class="details">

            <div>
                Player Outlook:
                <strong>
                    ${fmt(
                        player.outlook
                    )}
                </strong>
            </div>


            <div>
                V1 Launch Score:
                <strong>
                    ${fmt(
                        player.v1
                    )}
                </strong>
            </div>


            ${
                player.bestProp
                ?
                `
                <div>
                    Best Prop Environment:
                    <strong>
                        ${fmt(
                            player.bestProp
                        )}
                        ${fmt(
                            player.bestPropScore
                        )}
                    </strong>
                </div>
                `
                :
                ""
            }

        </div>

    </div>
    `;
}
// ============================================================
// NAVIGATION
// ============================================================

function setupNav() {

    $$(".navbtn")
    .forEach(
        button => {

            button.onclick =
                () => {

                    $$(".navbtn")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button
                    .classList
                    .add(
                        "active"
                    );


                    $$(".tabpage")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    const page =
                        $(
                            "#"
                            +
                            button.dataset.tab
                        );


                    if (
                        page
                    ) {

                        page
                        .classList
                        .add(
                            "active"
                        );
                    }
                };
        }
    );


    [
        "search",
        "positionFilter",
        "minScore"
    ]

    .forEach(
        id => {

            const element =
                $(
                    "#"
                    +
                    id
                );


            if (
                !element
            ) {

                return;
            }


            element.addEventListener(

                id
                ===
                "search"
                    ?
                    "input"
                    :
                    "change",

                renderGames
            );
        }
    );
}


// ============================================================
// RANKINGS DEFINITIONS
// ============================================================

function buildRankDefinitions() {

    const definitions = {};


    // --------------------------------------------------------
    // PROP-ENVIRONMENT TABS
    // Preferred public order:
    // TD -> Outlook -> Matchup -> Passing -> Receiving ->
    // Rushing -> Best Prop
    // --------------------------------------------------------

    if (
        hasPublicPropData()
    ) {

        definitions.td = {

            title:
                "Best TD Environments",

            score:
                player =>
                    tdScore(
                        player
                    ),

            scoreLabel:
                () =>
                    "TD Score"
        };
    }


    definitions.outlook = {

        title:
            "Top Player Outlooks",

        score:
            player =>
                Number(
                    player.outlook
                    ||
                    0
                ),

        scoreLabel:
            () =>
                "Outlook Score"
    };


    definitions.matchup = {

        title:
            "Best Matchups",

        score:
            player =>
                Number(
                    player.matchup
                    ||
                    0
                ),

        scoreLabel:
            () =>
                "Matchup Score"
    };


    if (
        hasPublicPropData()
    ) {

        definitions.passing = {

            title:
                "Best Passing Environments",

            score:
                player =>
                    passingScore(
                        player
                    ),

            scoreLabel:
                () =>
                    "Passing Score"
        };


        definitions.receiving = {

            title:
                "Best Receiving Environments",

            score:
                player =>
                    receivingScore(
                        player
                    ),

            scoreLabel:
                () =>
                    "Receiving Score"
        };


        definitions.rushing = {

            title:
                "Best Rushing Environments",

            score:
                player =>
                    rushingScore(
                        player
                    ),

            scoreLabel:
                () =>
                    "Rushing Score"
        };


        definitions.prop = {

            title:
                "Best Prop Environments",

            score:
                player =>
                    Number(
                        player.bestPropScore
                        ||
                        0
                    ),

            scoreLabel:
                player =>
                    player.bestProp
                    ||
                    "Best Prop"
        };
    }


    // --------------------------------------------------------
    // FALLBACK WHEN PROP DATA DOES NOT EXIST
    // --------------------------------------------------------

    else {

        definitions.opportunity = {

            title:
                "Best Opportunity Ratings",

            score:
                player =>
                    Number(
                        player.opportunity
                        ||
                        0
                    ),

            scoreLabel:
                () =>
                    "Opportunity Score"
        };


        definitions.quality = {

            title:
                "Best Quality Ratings",

            score:
                player =>
                    Number(
                        player.quality
                        ||
                        0
                    ),

            scoreLabel:
                () =>
                    "Quality Score"
        };


        definitions.environment = {

            title:
                "Best Game Environments",

            score:
                player =>
                    Number(
                        player.gameEnvironment
                        ||
                        0
                    ),

            scoreLabel:
                () =>
                    "Game Env Score"
        };
    }


    return definitions;
}


// ============================================================
// RANKINGS DISPLAY
// ============================================================

function dnaTier(score) {
    const n = Math.max(0, Math.min(100, numericOrNull(score) ?? 0));

    if (n >= 95) {
        return { key: "elite", label: "ELITE", color: "#35ff8a", glow: true };
    }
    if (n >= 90) {
        return { key: "great", label: "GREAT", color: "#32D583", glow: false };
    }
    if (n >= 76.3) {
        return { key: "good", label: "GOOD", color: "#0A84FF", glow: false };
    }
    if (n >= 58) {
        return { key: "neutral", label: "NEUTRAL", color: "#F5C84C", glow: false };
    }
    if (n >= 32.4) {
        return { key: "below", label: "BELOW AVG", color: "#FF7A2F", glow: false };
    }
    return { key: "poor", label: "POOR", color: "#FF453A", glow: false };
}


function flaskScoreHtml(score, scoreLabel) {
    const value = Math.max(0, Math.min(100, numericOrNull(score) ?? 0));
    const tier = dnaTier(value);
    const label = String(scoreLabel || "Outlook Score").replace(/\s+Score$/i, "").toUpperCase();

    // One shared instrument coordinate system:
    // fillable chamber top = 8, bottom = 92, height = 84 SVG units.
    const chamberTop = 8;
    const chamberBottom = 92;
    const chamberHeight = chamberBottom - chamberTop;
    const scoreY = chamberBottom - (value / 100) * chamberHeight;
    const fillHeight = chamberBottom - scoreY;
    const uid = `reactor-${String(value).replace(".", "-")}-${Math.random().toString(36).slice(2, 8)}`;

    const majorTicks = [100,90,80,70,60,50,40,30,20,10,0].map((tick) => {
        const y = chamberBottom - (tick / 100) * chamberHeight;
        return `<g class="reactor-major-tick"><line x1="92" y1="${y}" x2="99" y2="${y}"></line><text x="102" y="${y}" dominant-baseline="middle">${tick}</text></g>`;
    }).join("");

    const minorTicks = [95,85,75,65,55,45,35,25,15,5].map((tick) => {
        const y = chamberBottom - (tick / 100) * chamberHeight;
        return `<line class="reactor-minor-tick" x1="94" y1="${y}" x2="98" y2="${y}"></line>`;
    }).join("");

    return `
        <div class="flask-score-visual reactor-score-visual ${tier.glow ? "reactor-elite-glow" : ""}" style="--flask-color:${tier.color}">
            <div class="flask-meter reactor-meter"
                 role="img"
                 aria-label="${label} Score: ${round1(value)} out of 100 — ${tier.label}">
                <svg class="reactor-svg" viewBox="0 0 170 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <defs>
                        <clipPath id="${uid}-clip">
                            <rect x="26" y="${chamberTop}" width="48" height="${chamberHeight}" rx="5"></rect>
                        </clipPath>
                        <linearGradient id="${uid}-fuel" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stop-color="${tier.color}" stop-opacity=".88"></stop>
                            <stop offset="62%" stop-color="${tier.color}" stop-opacity=".72"></stop>
                            <stop offset="100%" stop-color="${tier.color}" stop-opacity=".94"></stop>
                        </linearGradient>
                        <linearGradient id="${uid}-glass" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#d9fbff" stop-opacity=".16"></stop>
                            <stop offset="22%" stop-color="#d9fbff" stop-opacity=".03"></stop>
                            <stop offset="72%" stop-color="#d9fbff" stop-opacity=".02"></stop>
                            <stop offset="100%" stop-color="#d9fbff" stop-opacity=".12"></stop>
                        </linearGradient>
                    </defs>

                    <g class="reactor-hardware">
                        <rect class="reactor-cap" x="20" y="2.5" width="60" height="7" rx="2"></rect>
                        <line class="reactor-cap-detail" x1="28" y1="6" x2="72" y2="6"></line>
                        <text class="reactor-brand" x="50" y="6.3" text-anchor="middle" dominant-baseline="middle">LAUNCH LAB</text>
                        <rect class="reactor-shell" x="24" y="${chamberTop}" width="52" height="${chamberHeight}" rx="6"></rect>
                        <g clip-path="url(#${uid}-clip)">
                            <rect class="reactor-fuel" x="26" y="${scoreY}" width="48" height="${fillHeight}" fill="url(#${uid}-fuel)"></rect>
                            <rect class="reactor-glass-reflection" x="26" y="${chamberTop}" width="48" height="${chamberHeight}" fill="url(#${uid}-glass)"></rect>
                            <line class="reactor-fuel-surface" x1="27" y1="${scoreY}" x2="73" y2="${scoreY}"></line>
                        </g>
                        <rect class="reactor-bottom-housing" x="19" y="90.5" width="62" height="7" rx="2"></rect>
                        <line class="reactor-bottom-detail" x1="27" y1="94" x2="73" y2="94"></line>
                    </g>

                    <g class="reactor-scale">
                        <line class="reactor-scale-rail" x1="92" y1="${chamberTop}" x2="92" y2="${chamberBottom}"></line>
                        ${minorTicks}
                        ${majorTicks}
                    </g>

                    <g class="reactor-live-indicator">
                        <line class="reactor-indicator-line" x1="72" y1="${scoreY}" x2="130" y2="${scoreY}"></line>
                        <circle class="reactor-indicator-node" cx="92" cy="${scoreY}" r="1.35"></circle>
                        <rect class="reactor-readout" x="130" y="${scoreY - 5.2}" width="35" height="10.4" rx="2.4"></rect>
                        <text class="reactor-readout-text" x="147.5" y="${scoreY}" text-anchor="middle" dominant-baseline="middle">${round1(value)}</text>
                    </g>
                </svg>
            </div>
            <div class="flask-caption reactor-caption"><strong>${label}</strong><span>${tier.label}</span></div>
        </div>
    `;
}
function renderPlayerIntel(player, scoreLabel, scoreValue) {
    const panel = $("#playerIntel");
    if (!panel || !player) return;
    const activeScore = numericOrNull(scoreValue) ?? numericOrNull(player.outlook);
    const activeTier = dnaTier(activeScore);
    const metrics = [["Matchup",player.matchup],["Opportunity",player.opportunity],["Quality",player.quality],["Game Environment",player.gameEnvironment]];
    const metricHtml = metrics.map(([label,value]) => {
        const n = numericOrNull(value);
        const width = n === null ? 0 : Math.max(0,Math.min(100,n));
        return `<div class="intel-metric"><div class="intel-metric-head"><span>${label}</span><strong class="${gclass(grade(n))}">${n===null?"—":round1(n)}</strong></div><div class="intel-track"><span style="width:${width}%"></span></div></div>`;
    }).join("");
    const signal = player.bestProp ? `<div class="launch-signal"><div class="launch-signal-icon">🚀</div><div><span>LAUNCH SIGNAL</span><strong>${player.bestProp}</strong><p>${round1(player.bestPropScore)} prop-environment rating</p></div></div>` : `<div class="launch-signal muted-signal"><div class="launch-signal-icon">◎</div><div><span>LAUNCH SIGNAL</span><strong>Player Outlook</strong><p>${round1(player.outlook)} overall weekly rating</p></div></div>`;
    panel.innerHTML = `<div class="intel-hero">${playerVisualHtml(player,"intel-player-visual")}<div class="intel-title"><div class="eyebrow">${player.team} · ${player.position}${player.role?" · "+player.role:""}</div><h3>${player.name}</h3><p>vs ${player.opponent}${player.homeAway?" · "+player.homeAway:""}</p><div class="intel-score-inline"><span>${scoreLabel||"Outlook Score"}</span><strong style="color:${activeTier.color}">${round1(activeScore)}</strong><small>${activeTier.label}</small></div></div>${flaskScoreHtml(activeScore, scoreLabel)}</div><div class="intel-section-title">MODEL INSTRUMENTS</div><div class="intel-metrics">${metricHtml}</div><div class="intel-chips">${player.confidenceBadge?`<span>${player.confidenceBadge}</span>`:""}${player.gameTotal?`<span>O/U ${round1(player.gameTotal)}</span>`:""}</div>${signal}`;
}

function rankingPropSignal(player, key) {

    const candidates = {

        passing: [
            "Passing Yards",
            "Passing TD"
        ],

        receiving: [
            "Receiving Yards",
            "Receptions"
        ],

        rushing: [
            "Rushing Yards"
        ],

        td: [
            "TD",
            "Passing TD",
            "Receiving TD",
            "Rushing TD"
        ]
    };


    if (
        key === "prop"
        ||
        key === "outlook"
        ||
        key === "matchup"
    ) {

        const score =
            numericOrNull(
                player.bestPropScore
            );


        return (
            player.bestProp
            &&
            score !== null
        )
            ? {
                label: player.bestProp,
                score
            }
            : null;
    }


    const props =
        candidates[key]
        ||
        [];


    let best =
        null;


    props.forEach(
        propName => {

            const score =
                numericOrNull(
                    player?.props?.[propName]?.score
                );


            if (
                score !== null
                &&
                (
                    !best
                    ||
                    score > best.score
                )
            ) {

                best = {
                    label: propName,
                    score
                };
            }
        }
    );


    return best;
}


function renderRankings(key) {
    const tabs=$("#rankingTabs");
    if(!tabs) return;
    const rankDefs=buildRankDefinitions();
    if(!rankDefs[key]) key=rankDefs.td ? "td" : "outlook";
    tabs.innerHTML=Object.entries(rankDefs).map(([rankKey,definition])=>`<button data-rank="${rankKey}" class="${rankKey===key?"active":""}">${definition.title}</button>`).join("");
    tabs.querySelectorAll("button").forEach(button=>{button.onclick=()=>renderRankings(button.dataset.rank);});
    const definition=rankDefs[key];
    const rows=PLAYERS.filter(player=>DATA_MODE==="LEGACY_2025"||player.headlineEligible).map(player=>[player,Number(definition.score(player))]).filter(row=>Number.isFinite(row[1])&&row[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,50);
    $("#rankingsList").innerHTML=rows.map(([player,score],index)=>{
        const scoreLabel=definition.scoreLabel(player);
        const propSignal=rankingPropSignal(player,key);
        const propSignalHtml=propSignal
            ? `<div class="rank-prop-signal"><span>TOP PROP</span> · ${propSignal.label.toUpperCase()}</div>`
            : "";
        return `<div class="rank-mobile-item"><button class="rank-row rank-row-v2" type="button" data-rank-index="${index}" aria-expanded="false"><div class="rank-num">${index+1}</div>${playerVisualHtml(player,"rank-player-visual")}<div class="rank-player"><strong>${player.name}</strong><div class="player-sub">${player.team} ${player.position} · vs ${player.opponent}</div>${propSignalHtml}</div><div class="rank-score-wrap"><div class="score small ${gclass(grade(score))}">${round1(score)}</div><span>${scoreLabel}</span></div></button><div class="rank-mobile-intel" data-mobile-intel="${index}"></div></div>`;
    }).join("");
    const buttons=$$(".rank-row-v2");
    buttons.forEach(button=>{button.onclick=()=>{
        const i=Number(button.dataset.rankIndex);
        const row=rows[i];
        if(!row) return;

        const mobile=window.matchMedia("(max-width: 980px)").matches;

        if(mobile){
            const wasOpen=button.classList.contains("selected");
            buttons.forEach(x=>{
                x.classList.remove("selected");
                x.setAttribute("aria-expanded","false");
            });
            $$(".rank-mobile-intel").forEach(panel=>{
                panel.innerHTML="";
                panel.classList.remove("open");
            });

            if(wasOpen) return;

            button.classList.add("selected");
            button.setAttribute("aria-expanded","true");
            const panel=button.closest(".rank-mobile-item")?.querySelector(".rank-mobile-intel");
            const desktopPanel=$("#playerIntel");

            if(panel && desktopPanel){
                renderPlayerIntel(row[0],definition.scoreLabel(row[0]),row[1]);
                panel.innerHTML=desktopPanel.innerHTML;
                panel.classList.add("open");
            }
            return;
        }

        buttons.forEach(x=>x.classList.remove("selected"));
        button.classList.add("selected");
        renderPlayerIntel(row[0],definition.scoreLabel(row[0]),row[1]);
    };});
    if(rows.length){
        if(!window.matchMedia("(max-width: 980px)").matches){
            buttons[0]?.classList.add("selected");
            buttons[0]?.setAttribute("aria-expanded","true");
            renderPlayerIntel(rows[0][0],definition.scoreLabel(rows[0][0]),rows[0][1]);
        } else {
            const panel=$("#playerIntel");
            if(panel) panel.innerHTML="";
        }
    } else {
        const panel=$("#playerIntel");
        if(panel){
            panel.innerHTML='<div class="intel-empty"><div class="intel-orbit">◎</div><div class="eyebrow">PLAYER INTELLIGENCE</div><h3>No eligible players</h3><p>No players have a qualifying score for this ranking in the selected week.</p></div>';
        }
    }
}

// ============================================================
// PERFORMANCE TAB
// ============================================================

function perfTable(
    title,
    rows
) {

    if (
        !rows?.length
    ) {

        return "";
    }


    const keys = [

        "position",
        "outcome",
        "rows",
        "v1_spearman",
        "v2_spearman",
        "spearman_winner"
    ];


    return `

    <h3>
        ${title}
    </h3>

    <div style="overflow:auto">

        <table class="perf-table">

            <thead>

                <tr>

                    ${
                        keys
                        .map(
                            key =>
                                `
                                <th>
                                    ${
                                        key.replaceAll(
                                            "_",
                                            " "
                                        )
                                    }
                                </th>
                                `
                        )
                        .join("")
                    }

                </tr>

            </thead>


            <tbody>

                ${
                    rows
                    .map(
                        row =>
                            `
                            <tr>

                                ${
                                    keys
                                    .map(
                                        key =>
                                            `
                                            <td>
                                                ${
                                                    fmt(
                                                        row[key]
                                                    )
                                                }
                                            </td>
                                            `
                                    )
                                    .join("")
                                }

                            </tr>
                            `
                    )
                    .join("")
                }

            </tbody>

        </table>

    </div>
    `;
}


function renderPerformance() {

    const fantasy =
        $("#perfFantasy");


    const props =
        $("#perfProps");


    if (
        DATA_MODE
        ===
        "LEGACY_2025"
    ) {

        if (
            fantasy
        ) {

            fantasy.innerHTML =
                perfTable(

                    "Fantasy V1 vs V2",

                    DATA.performance?.fantasy
                )

                ||

                `
                <div class="privacy-note">
                    No fantasy performance table available
                    for this historical week.
                </div>
                `;
        }


        if (
            props
        ) {

            props.innerHTML =
                perfTable(

                    "Prop V1 vs V2",

                    DATA.performance?.props
                )

                ||

                `
                <div class="privacy-note">
                    No prop performance table available
                    for this historical week.
                </div>
                `;
        }


        return;
    }


    if (
        fantasy
    ) {

        fantasy.innerHTML =
            `
            <div class="privacy-note">

                <strong>
                    2026 live model tracking begins Week 1.
                </strong>

                <br><br>

                Pregame predictions will be frozen before
                kickoff and compared with actual results
                after games are completed.

            </div>
            `;
    }


    if (
        props
    ) {

        props.innerHTML =
            `
            <div class="privacy-note">

                <strong>
                    Sportsbook prop tracking is not live yet.
                </strong>

                <br><br>

                Player Outlook ratings and betting edge are
                intentionally kept separate.

                <br><br>

                Once sportsbook lines are integrated,
                Launch Lab will display prop-specific
                opportunities here.

            </div>
            `;
    }
}


// ============================================================
// START APPLICATION
// ============================================================

init();
