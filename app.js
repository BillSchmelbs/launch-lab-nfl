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

    const s =
        Number(score);


    if (
        Number.isNaN(s)
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
        "The QB, RB, WR, and TE boxes show how favorable the opposing defense is for each position. These are ratings — not projected fantasy points or yardage."
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


           const awayTeam =
    player.homeAway === "AWAY"
        ? player.team
        : player.opponent;

const homeTeam =
    player.homeAway === "HOME"
        ? player.team
        : player.opponent;

const teams = [
    awayTeam,
    homeTeam
];


            const gameKey =
                `${
                    player.gameDate || ""
                }_${
                    teams.join("_")
                }`;


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


            const game =
                gameMap.get(
                    gameKey
                );


            game.teams.add(
                player.team
            );


            game.teams.add(
                player.opponent
            );


            game.players.push(
                player.id
            );


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


    return (
        [
            ...gameMap.values()
        ]

        .map(
            game => {

                const teams =
                    [
                        ...game.teams
                    ];


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


                game.matchupLabel =
    `${teams[0]} @ ${teams[1]}`;


                return game;
            }
        )

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

async function init() {

    try {

        const indexResponse =
            await fetch(
                "data/index.json"
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
            "data/" + file
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
        "outlook"
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


    const topPlayers =
        [
            ...headlinePlayers
        ]

        .sort(
            (a, b) =>
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
                )
        );


    const props =
        headlinePlayers

        .filter(
            player =>
                player.bestPropScore
                !==
                null
                &&
                player.bestPropScore
                !==
                undefined
        )

        .sort(
            (a, b) =>
                Number(
                    b.bestPropScore
                    ||
                    0
                )
                -
                Number(
                    a.bestPropScore
                    ||
                    0
                )
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
        $("#topPlayer")
    ) {

        $("#topPlayer").textContent =
            topPlayers[0]
                ?
                (
                    `${topPlayers[0].name} · `
                    +
                    `${round1(
                        topPlayers[0].outlook
                    )}/100`
                )
                :
                "—";
    }


    if (
        $("#topProp")
    ) {

        if (
            props[0]
        ) {

            $("#topProp").textContent =
                (
                    `${props[0].name} `
                    +
                    `${fmt(
                        props[0].bestProp
                    )} · `
                    +
                    `${fmt(
                        props[0].bestPropScore
                    )}`
                );
        }


        else {

            $("#topProp").textContent =
                "Sportsbook edge coming soon";
        }
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
                                ${matchupLabel}
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
                                                `${round1(
                                                    environmentScore
                                                )}/100`
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

                    element
                    .parentElement
                    .classList
                    .toggle(
                        "open"
                    );
                };
        }
    );


    $$(".posbtn")
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
                                round1(
                                    score
                                )
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
                        (a, b) =>
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
                            )
                    );


                if (
                    !players.length
                ) {

                    return "";
                }


                return `

                <button class="posbtn">
                    ${pos} · ${players.length} players
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
                                    round1(
                                        environmentScore
                                    )
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


        <div class="player-sub info-label">

            How the matchup grades by position

            ${infoButtonHtml(
                "positionMatchup",
                "Position Matchup Ratings"
            )}

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
                    ${displayValue}
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
                            ${
                                fmt(
                                    value.score
                                )
                            }
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
                            `${round1(
                                player.outlook
                            )}/100`
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

    const definitions = {

        outlook: {

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
        },


        matchup: {

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
        }
    };


    // --------------------------------------------------------
    // PROP-ENVIRONMENT TABS
    // --------------------------------------------------------

    if (
        hasPublicPropData()
    ) {

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

function renderRankings(key) {

    const tabs =
        $("#rankingTabs");


    if (
        !tabs
    ) {

        return;
    }


    const rankDefs =
        buildRankDefinitions();


    if (
        !rankDefs[key]
    ) {

        key =
            "outlook";
    }


    tabs.innerHTML =
        Object.entries(
            rankDefs
        )

        .map(
            ([rankKey, definition]) => `

                <button
                    data-rank="${rankKey}"
                    class="${
                        rankKey
                        ===
                        key
                            ?
                            "active"
                            :
                            ""
                    }"
                >
                    ${definition.title}
                </button>
            `
        )

        .join("");


    tabs
    .querySelectorAll(
        "button"
    )

    .forEach(
        button => {

            button.onclick =
                () => {

                    renderRankings(
                        button.dataset.rank
                    );
                };
        }
    );


    const definition =
        rankDefs[key];


    const rows =
        PLAYERS

        .filter(
            player =>
                (
                    DATA_MODE
                    ===
                    "LEGACY_2025"
                )
                ||
                player.headlineEligible
        )

        .map(
            player => [

                player,

                Number(
                    definition.score(
                        player
                    )
                )
            ]
        )

        .filter(
            row =>
                Number.isFinite(
                    row[1]
                )
                &&
                row[1] > 0
        )

        .sort(
            (a, b) =>
                b[1]
                -
                a[1]
        )

        .slice(
            0,
            50
        );


    $("#rankingsList").innerHTML =
        rows

        .map(
            (
                [
                    player,
                    score
                ],
                index
            ) => {

                const scoreLabel =
                    definition.scoreLabel(
                        player
                    );


                return `

                <div class="rank-row">

                    <div class="rank-num">
                        ${index + 1}
                    </div>


                    <div>

                        <strong>
                            ${player.name}
                        </strong>

                        <div class="player-sub">

                            ${player.team}
                            ${player.position}
                            · vs ${player.opponent}

                        </div>

                    </div>


                    <div
                        class="
                            score
                            small
                            ${
                                gclass(
                                    grade(
                                        score
                                    )
                                )
                            }
                        "
                    >
                        ${round1(
                            score
                        )}
                    </div>


                    <div class="hide-mobile">

                        ${scoreLabel}

                    </div>


                    <div
                        class="
                            hide-mobile
                            player-sub
                        "
                    >

                        Outlook
                        ${round1(
                            player.outlook
                        )}

                    </div>

                </div>
                `;
            }
        )

        .join("");
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
