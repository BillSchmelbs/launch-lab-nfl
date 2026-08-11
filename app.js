// ============================================================
// LAUNCH LAB NFL — DUAL FORMAT PUBLIC WEBSITE APP
//
// Supports:
//
//   NEW FORMAT
//   2026+ sanitized public JSON
//
//   LEGACY FORMAT
//   Original 2025 Week 18 website JSON
//
// The app detects the schema automatically.
// ============================================================


let DATA = null;

let PLAYERS = [];

let GAMES = [];

let PLAYER_MAP = new Map();

let DATA_MODE = null;


const $ = selector =>
    document.querySelector(
        selector
    );


const $$ = selector =>
    [
        ...document.querySelectorAll(
            selector
        )
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
        Number(
            value
        );


    if (
        Number.isNaN(
            number
        )
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


function grade(score) {

    const s =
        Number(
            score
        );


    if (
        Number.isNaN(
            s
        )
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
        String(
            value
        )
        .toLowerCase();


    if (
        g.includes(
            "elite"
        )
    ) {

        return "g-elite";
    }


    if (
        g.includes(
            "great"
        )
    ) {

        return "g-great";
    }


    if (
        g.includes(
            "good"
        )
    ) {

        return "g-good";
    }


    if (
        g.includes(
            "above"
        )
    ) {

        return "g-above";
    }


    if (
        g.includes(
            "neutral"
        )
    ) {

        return "g-neutral";
    }


    if (
        g.includes(
            "difficult"
        )
    ) {

        return "g-difficult";
    }


    if (
        g.includes(
            "avoid"
        )
    ) {

        return "g-avoid";
    }


    return "g-bad";
}


function gradeRank(value = "") {

    const g =
        String(
            value
        )
        .toLowerCase();


    if (
        g.includes(
            "elite"
        )
    ) {

        return 8;
    }


    if (
        g.includes(
            "great"
        )
    ) {

        return 7;
    }


    if (
        g.includes(
            "good"
        )
    ) {

        return 6;
    }


    if (
        g.includes(
            "above"
        )
    ) {

        return 5;
    }


    if (
        g.includes(
            "neutral"
        )
    ) {

        return 4;
    }


    if (
        g.includes(
            "difficult"
        )
    ) {

        return 3;
    }


    if (
        g.includes(
            "bad"
        )
    ) {

        return 2;
    }


    if (
        g.includes(
            "avoid"
        )
    ) {

        return 1;
    }


    return 0;
}


function byId(id) {

    return (
        PLAYER_MAP.get(
            id
        )
    );
}


// ============================================================
// SCHEMA DETECTION
// ============================================================

function detectDataMode(data) {

    // --------------------------------------------------------
    // NEW 2026+ SANITIZED FORMAT
    //
    // meta + players where players use player_name,
    // model_score_v2, matchup_rating, etc.
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // LEGACY 2025 FORMAT
    //
    // players use fields like:
    //
    // name
    // outlook
    // matchup
    //
    // and often data.games exists.
    // --------------------------------------------------------

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
            {},

        bestProp:
            null,

        bestPropScore:
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
            "LEGACY_2025_SAMPLE",

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
            (
                raw.opportunity
                ??
                null
            ),

        opportunityGrade:
            raw.opportunityGrade
            ||
            (
                raw.opportunity !== null
                &&
                raw.opportunity !== undefined
                    ? grade(
                        raw.opportunity
                    )
                    : "N/A"
            ),

        quality:
            (
                raw.quality
                ??
                null
            ),

        qualityGrade:
            raw.qualityGrade
            ||
            (
                raw.quality !== null
                &&
                raw.quality !== undefined
                    ? grade(
                        raw.quality
                    )
                    : "N/A"
            ),

        gameEnvironment:
            (
                raw.gameEnvironment
                ??
                raw.gameEnvironmentScore
                ??
                null
            ),

        gameEnvironmentGrade:
            raw.gameEnvironmentGrade
            ||
            (
                raw.gameEnvironment !== null
                &&
                raw.gameEnvironment !== undefined
                    ? grade(
                        raw.gameEnvironment
                    )
                    : "N/A"
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
            "2025 Sample",

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
            (
                "Historical Launch Lab sample rating."
            ),

        seasonContext:
            (
                "Historical 2025 Week 18 sample output."
            ),

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


            const teams = [

                player.team,
                player.opponent

            ]
            .sort();


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


            if (
                player.headlineEligible
                &&
                player.gameEnvironment !== null
                &&
                player.gameEnvironment !== undefined
            ) {

                game.environmentValues.push(

                    Number(
                        player.gameEnvironment
                    )
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
                                (a, b) => a + b,
                                0
                            )
                            /
                            game.environmentValues.length
                        )
                        :
                        50;


                game.environmentScore =
                    (
                        Math.round(
                            environmentScore
                            *
                            10
                        )
                        /
                        10
                    );


                game.environmentGrade =
                    grade(
                        game.environmentScore
                    );


                game.matchupLabel =
                    teams.join(
                        " @ "
                    );


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
// BUILD GAMES FOR LEGACY FORMAT
// ============================================================

function buildLegacyGames(data) {

    if (
        Array.isArray(
            data.games
        )
        &&
        data.games.length
    ) {

        return (
            data.games.map(
                game => {

                    return {

                        ...game,

                        environmentScore:
                            (
                                game.environmentScore
                                ??
                                game.environment
                                ??
                                null
                            ),

                        environmentGrade:
                            (
                                game.environmentGrade
                                ||
                                grade(
                                    game.environmentScore
                                    ??
                                    game.environment
                                    ??
                                    50
                                )
                            ),

                        gameDate:
                            (
                                game.gameDate
                                ||
                                null
                            ),

                        gameTime:
                            (
                                game.gameTime
                                ||
                                null
                            )
                    };
                }
            )
        );
    }


    // fallback if legacy file has no DATA.games

    return (
        buildPublicGames(
            PLAYERS
        )
    );
}


// ============================================================
// INITIALIZE SITE
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
                "No current week file found in index.json"
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

    }

    catch (
        error
    ) {

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

async function loadWeek(
    file
) {

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


    console.log(
        "Launch Lab data mode:",
        DATA_MODE
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
                    `${meta.season || 2026} `
                    +
                    `Week ${meta.week || 1}`
                );


        return;
    }


    if (
        DATA_MODE
        ===
        "LEGACY_2025"
    ) {

        dataStatus.textContent =
            (
                DATA.meta?.label
                ||
                "2025 Week 18 Sample"
            );
    }
}


// ============================================================
// QUICK CARDS
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
        ]
        .sort(
            (a, b) => {

                const aScore =
                    (
                        a.environmentScore
                        ??
                        0
                    );


                const bScore =
                    (
                        b.environmentScore
                        ??
                        0
                    );


                return (
                    bScore
                    -
                    aScore
                );
            }
        );


    const topPlayers =
        [
            ...headlinePlayers
        ]
        .sort(
            (a, b) => {

                return (
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
            }
        );


    const props =
        headlinePlayers

        .filter(
            player => {

                return (
                    player.bestPropScore
                    !==
                    null
                    &&
                    player.bestPropScore
                    !==
                    undefined
                );
            }
        )

        .sort(
            (a, b) => {

                return (
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
            }
        );


    if (
        $("#bestGame")
    ) {

        $("#bestGame").textContent =
            games[0]
                ?
                (
                    `${games[0].matchupLabel} · `
                    +
                    `${
                        fmt(
                            games[0].environmentGrade
                        )
                    }`
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
            DATA_MODE
            ===
            "LEGACY_2025"
            &&
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

            let gamePlayerIds =
                (
                    game.players
                    ||
                    []
                );


            // ------------------------------------------------
            // Legacy files may have game.players already
            // ------------------------------------------------

            const gamePlayers =
                gamePlayerIds

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

                // fallback by team/opponent matching

                const labels =
                    (
                        game.matchupLabel
                        ||
                        ""
                    );


                const parts =
                    labels.split(
                        "@"
                    )
                    .map(
                        x =>
                            x.trim()
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


            const teams =
                [
                    ...new Set(

                        gamePlayers.map(
                            player =>
                                player.team
                        )
                    )
                ];


            const environmentScore =
                (
                    game.environmentScore
                    ??
                    50
                );


            const environmentGrade =
                (
                    game.environmentGrade
                    ||
                    grade(
                        environmentScore
                    )
                );


            const matchupLabel =
                (
                    game.matchupLabel
                    ||
                    teams.join(
                        " @ "
                    )
                );


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
                                        `${round1(
                                            environmentScore
                                        )}/100`
                                        :
                                        fmt(
                                            environmentGrade
                                        )
                                }
                            </div>

                            <div class="player-sub">
                                Game Environment
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
        (
            teamPlayers[0]?.opponent
            ||
            ""
        );


    const environmentValues =
        teamPlayers

        .map(
            player =>
                Number(
                    player.gameEnvironment
                )
        )

        .filter(
            Number.isFinite
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
            50;


    const environmentGrade =
        grade(
            environmentScore
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

                const players =
                    teamPlayers.filter(
                        player =>
                            player.position
                            ===
                            pos
                    );


                const matchupValues =
                    players

                    .map(
                        player =>
                            Number(
                                player.matchup
                            )
                    )

                    .filter(
                        Number.isFinite
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
            pos => {

                return (
                    positionFilter
                    ===
                    "ALL"
                    ||
                    pos
                    ===
                    positionFilter
                );
            }
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
                    )

                    .sort(
                        (a, b) => {

                            if (
                                a.headlineEligible
                                !==
                                b.headlineEligible
                            ) {

                                return (
                                    a.headlineEligible
                                        ?
                                        -1
                                        :
                                        1
                                );
                            }


                            return (
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
                        }
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
                            round1(
                                environmentScore
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


        <div class="player-sub">
            How the matchup grades by position
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

function renderPlayer(
    player
) {

    const metrics = [

        [
            "Outlook V2",
            player.outlook,
            player.outlookGrade
        ],

        [
            "Matchup",
            player.matchup,
            player.matchupGrade
        ],

        [
            "Opportunity",
            player.opportunity,
            player.opportunityGrade
        ],

        [
            "Quality",
            player.quality,
            player.qualityGrade
        ],

        [
            "Game Env",
            player.gameEnvironment,
            player.gameEnvironmentGrade
        ]

    ]
    .map(
        metric => {

            const numeric =
                Number(
                    metric[1]
                );


            const hasNumeric =
                Number.isFinite(
                    numeric
                );


            let displayValue;


            if (
                hasNumeric
            ) {

                displayValue =
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
                        );
            }


            else {

                displayValue =
                    fmt(
                        metric[2]
                    );
            }


            return `

            <div class="metric">

                <span>
                    ${metric[0]}
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
        DATA_MODE
        ===
        "LEGACY_2025"
    ) {

        propsHtml =
            Object.entries(
                player.props
                ||
                {}
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


    const actual =
        (
            player.actualPpr
            !==
            null
            &&
            player.actualPpr
            !==
            ""
        )
            ?
            `
            <div class="pill">
                Actual PPR ${
                    player.actualPpr
                }
            </div>
            `
            :
            "";


    const headlineBadge =
        player.headlineEligible
            ?
            `
            <span class="pill">
                Headline Role
            </span>
            `
            :
            `
            <span class="pill">
                Extended Player
            </span>
            `;


    const confidence =
        (
            player.confidenceBadge
            ||
            (
                DATA_MODE
                ===
                "LEGACY_2025"
                    ?
                    "2025 Sample"
                    :
                    "Early Season"
            )
        );


    const legacyWhy =
        (
            DATA_MODE
            ===
            "LEGACY_2025"
        )
            ?
            (
                player.why
                ||
                []
            )
            .map(
                item =>
                    `<div>• ${item}</div>`
            )
            .join("")
            :
            "";


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

                    ${headlineBadge}

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

                    ${
                        DATA_MODE
                        ===
                        "PUBLIC_V2"
                            ?
                            "Launch Lab Rating"
                            :
                            "Player Outlook"
                    }

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
                    Ratings use a 0–100 scale.
                    They are not projected yards or fantasy points.
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

            ${
                DATA_MODE
                ===
                "LEGACY_2025"
                    ?
                    "Why this score / Advanced model ▾"
                    :
                    "Rating details / Advanced view ▾"
            }

        </button>


        <div class="details">

            ${legacyWhy}


            <div
                style="
                    margin-top:6px;
                "
            >
                V1 Launch Score:
                <strong>
                    ${fmt(
                        player.v1
                    )}
                </strong>

                ${actual}
            </div>


            ${
                DATA_MODE
                ===
                "LEGACY_2025"
                    ?
                    `
                    <div>
                        Best prop environment:
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
                    `
                    <div>
                        Position Rank:
                        <strong>
                            ${fmt(
                                player.positionRank
                            )}
                        </strong>
                    </div>

                    <div>
                        Role:
                        <strong>
                            ${fmt(
                                player.role
                            )}
                        </strong>
                    </div>

                    <div>
                        Role Status:
                        <strong>
                            ${fmt(
                                player.roleStatus
                            )}
                        </strong>
                    </div>

                    <div>
                        Model Confidence:
                        <strong>
                            ${fmt(
                                confidence
                            )}
                        </strong>
                    </div>

                    <div
                        style="
                            margin-top:8px;
                            opacity:.8;
                        "
                    >
                        Early-season ratings use prior-season
                        evidence plus current 2026 roster,
                        team and matchup context.
                    </div>
                    `
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


            element
            .addEventListener(

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
// RANKINGS
// ============================================================

const rankDefsPublic = {

    outlook: [
        "Top Player Outlooks",
        player =>
            player.outlook
    ],

    matchup: [
        "Best Matchups",
        player =>
            player.matchup
    ],

    opportunity: [
        "Best Opportunity Ratings",
        player =>
            player.opportunity
    ],

    quality: [
        "Best Quality Ratings",
        player =>
            player.quality
    ],

    environment: [
        "Best Game Environments",
        player =>
            player.gameEnvironment
    ]
};


const rankDefsLegacy = {

    outlook: [
        "Top Player Outlooks",
        player =>
            player.outlook
    ],

    matchup: [
        "Best Matchups",
        player =>
            player.matchup
    ],

    receiving: [
        "Best Receiving Environments",
        player =>
            Math.max(
                player.props?.[
                    "Receiving Yards"
                ]?.score
                ||
                0,

                player.props?.Receptions?.score
                ||
                0
            )
    ],

    rushing: [
        "Best Rushing Environments",
        player =>
            (
                player.props?.[
                    "Rushing Yards"
                ]?.score
                ||
                0
            )
    ],

    td: [
        "Best TD Environments",
        player =>
            (
                player.props?.TD?.score
                ||
                player.props?.[
                    "Passing TD"
                ]?.score
                ||
                0
            )
    ],

    prop: [
        "Best Prop Environments",
        player =>
            (
                player.bestPropScore
                ||
                0
            )
    ]
};


function renderRankings(
    key
) {

    const tabs =
        $("#rankingTabs");


    if (
        !tabs
    ) {

        return;
    }


    const rankDefs =
        DATA_MODE
        ===
        "LEGACY_2025"
            ?
            rankDefsLegacy
            :
            rankDefsPublic;


    if (
        !rankDefs[
            key
        ]
    ) {

        key =
            "outlook";
    }


    tabs.innerHTML =
        Object.entries(
            rankDefs
        )

        .map(
            ([rankKey, value]) => `

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
                    ${value[0]}
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


    const rankFunction =
        rankDefs[
            key
        ][1];


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
                    rankFunction(
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
            ) => `

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

                        ${
                            DATA_MODE
                            ===
                            "PUBLIC_V2"
                                ?
                                `${round1(
                                    score
                                )}/100`
                                :
                                round1(
                                    score
                                )
                        }

                    </div>


                    <div class="hide-mobile">

                        ${
                            DATA_MODE
                            ===
                            "LEGACY_2025"
                                ?
                                (
                                    player.bestProp
                                    ||
                                    ""
                                )
                                :
                                (
                                    player.confidenceBadge
                                    ||
                                    ""
                                )
                        }

                    </div>


                    <div
                        class="
                            hide-mobile
                            player-sub
                        "
                    >

                        Outlook
                        ${
                            fmt(
                                player.outlook
                            )
                        }

                    </div>

                </div>
            `
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


    <div
        style="
            overflow:auto;
        "
    >

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
                                                        row[
                                                            key
                                                        ]
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
                    in this historical file.
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
                    in this historical file.
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

                <br><br>

                Historical and live V1 vs V2 performance
                reporting will appear here as the season
                progresses.

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
// START
// ============================================================

init();
