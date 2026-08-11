// ============================================================
// LAUNCH LAB NFL — PUBLIC WEBSITE APP
// 2026 WEEK 1 DATA STRUCTURE
// ============================================================

let DATA = null;
let PLAYERS = [];
let GAMES = [];
let PLAYER_MAP = new Map();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];


// ============================================================
// BASIC HELPERS
// ============================================================

function fmt(value) {
    return (
        value === null ||
        value === undefined ||
        value === ""
    )
        ? "—"
        : value;
}


function round1(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return Math.round(number * 10) / 10;
}


function grade(score) {

    const s = Number(score);

    if (Number.isNaN(s)) return "N/A";

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

    const g = String(value).toLowerCase();

    if (g.includes("elite")) return "g-elite";
    if (g.includes("great")) return "g-great";
    if (g.includes("good")) return "g-good";
    if (g.includes("above")) return "g-above";
    if (g.includes("neutral")) return "g-neutral";
    if (g.includes("difficult")) return "g-difficult";
    if (g.includes("avoid")) return "g-avoid";

    return "g-bad";
}


function gradeRank(value = "") {

    const g = String(value).toLowerCase();

    if (g.includes("elite")) return 8;
    if (g.includes("great")) return 7;
    if (g.includes("good")) return 6;
    if (g.includes("above")) return 5;
    if (g.includes("neutral")) return 4;
    if (g.includes("difficult")) return 3;
    if (g.includes("bad")) return 2;
    if (g.includes("avoid")) return 1;

    return 0;
}


function byId(id) {
    return PLAYER_MAP.get(id);
}


// ============================================================
// NORMALIZE NEW PUBLIC PLAYER FORMAT
// ============================================================

function normalizePlayer(raw) {

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
            raw.headline_eligible === true,

        displayGroup:
            raw.display_group,

        changedTeam:
            raw.changed_team === true,

        positionChangeReview:
            raw.position_change_review === true,

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
            raw.season_context
    };
}


// ============================================================
// BUILD GAME CARDS FROM PLAYER DATA
// ============================================================

function buildGames(players) {

    const gameMap = new Map();


    players.forEach(player => {

        if (
            !player.team ||
            !player.opponent
        ) {
            return;
        }


        const teams = [
            player.team,
            player.opponent
        ].sort();


        const gameKey =
            `${player.gameDate || ""}_${teams.join("_")}`;


        if (!gameMap.has(gameKey)) {

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


        const game = gameMap.get(
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
            player.headlineEligible &&
            player.gameEnvironment !== null &&
            player.gameEnvironment !== undefined
        ) {

            game.environmentValues.push(
                Number(
                    player.gameEnvironment
                )
            );
        }
    });


    return [...gameMap.values()]
        .map(game => {

            const teams = [...game.teams];


            const environmentScore =
                game.environmentValues.length
                    ? (
                        game.environmentValues.reduce(
                            (a, b) => a + b,
                            0
                        )
                        /
                        game.environmentValues.length
                    )
                    : 50;


            game.environmentScore =
                Math.round(
                    environmentScore * 10
                ) / 10;


            game.environmentGrade =
                grade(
                    game.environmentScore
                );


            game.matchupLabel =
                teams.join(" @ ");


            return game;
        })
        .sort((a, b) => {

            if (
                a.gameDate !== b.gameDate
            ) {
                return String(
                    a.gameDate
                ).localeCompare(
                    String(
                        b.gameDate
                    )
                );
            }

            return String(
                a.gameTime
            ).localeCompare(
                String(
                    b.gameTime
                )
            );
        });
}


// ============================================================
// LOAD WEBSITE
// ============================================================

async function init() {

    try {

        const indexResponse = await fetch(
            "data/index.json"
        );


        if (!indexResponse.ok) {
            throw new Error(
                "Could not load data/index.json"
            );
        }


        const index = await indexResponse.json();


        const weekSelect =
            $("#weekSelect");


        weekSelect.innerHTML = "";


        // ----------------------------------------------------
        // NEW 2026 INDEX FORMAT
        // ----------------------------------------------------

        const availableWeeks =
            index.available_weeks || [];


        availableWeeks.forEach(week => {

            weekSelect.add(

                new Option(
                    week.label,
                    week.week_file
                )
            );
        });


        const currentFile =
            index.current?.week_file
            ||
            availableWeeks[0]?.week_file;


        if (!currentFile) {

            throw new Error(
                "No current week file found in index.json"
            );
        }


        weekSelect.value =
            currentFile;


        weekSelect.onchange = () => {

            loadWeek(
                weekSelect.value
            );
        };


        await loadWeek(
            currentFile
        );


        setupNav();

    }

    catch (error) {

        console.error(
            error
        );


        const gamesElement =
            $("#games");


        if (gamesElement) {

            gamesElement.innerHTML =
                `<div class="privacy-note">
                    Unable to load Launch Lab data.
                    Please refresh the page.
                </div>`;
        }
    }
}


// ============================================================
// LOAD ONE WEEK
// ============================================================

async function loadWeek(file) {

    const response = await fetch(
        "data/" + file
    );


    if (!response.ok) {

        throw new Error(
            `Could not load ${file}`
        );
    }


    DATA = await response.json();


    PLAYERS = (
        DATA.players || []
    ).map(
        normalizePlayer
    );


    PLAYER_MAP = new Map(

        PLAYERS.map(
            player => [
                player.id,
                player
            ]
        )
    );


    GAMES = buildGames(
        PLAYERS
    );


    // --------------------------------------------------------
    // DATA STATUS
    // --------------------------------------------------------

    const dataStatus =
        $("#dataStatus");


    if (dataStatus) {

        const meta = DATA.meta || {};


        dataStatus.textContent =
            meta.site_state ===
            "EARLY_SEASON_PREVIEW"
                ? "2026 Week 1 — Early Season Preview"
                : (
                    `${meta.season || 2026} Week ${meta.week || 1}`
                );
    }


    renderQuick();

    renderGames();

    renderRankings(
        "outlook"
    );

    renderPerformance();
}


// ============================================================
// QUICK SUMMARY CARDS
// ============================================================

function renderQuick() {

    const headlinePlayers =
        PLAYERS.filter(
            p => p.headlineEligible
        );


    const games = [...GAMES]
        .sort(
            (a, b) =>
                b.environmentScore
                -
                a.environmentScore
        );


    const players =
        [...headlinePlayers]
        .sort(
            (a, b) =>
                (b.outlook || 0)
                -
                (a.outlook || 0)
        );


    const matchupPlayers =
        [...headlinePlayers]
        .sort(
            (a, b) =>
                (b.matchup || 0)
                -
                (a.matchup || 0)
        );


    if ($("#bestGame")) {

        $("#bestGame").textContent =
            games[0]
                ? (
                    `${games[0].matchupLabel} · `
                    +
                    `${round1(games[0].environmentScore)}/100 `
                    +
                    `${games[0].environmentGrade}`
                )
                : "—";
    }


    if ($("#topPlayer")) {

        $("#topPlayer").textContent =
            players[0]
                ? (
                    `${players[0].name} · `
                    +
                    `${round1(players[0].outlook)}/100`
                )
                : "—";
    }


    // --------------------------------------------------------
    // PROP ENGINE IS NOT LIVE YET
    //
    // We intentionally do NOT pretend a public model rating
    // is a sportsbook betting edge.
    // --------------------------------------------------------

    if ($("#topProp")) {

        $("#topProp").textContent =
            "Sportsbook edge coming soon";
    }
}


// ============================================================
// FILTERED GAME BOARD
// ============================================================

function renderGames() {

    const search =
        ($("#search")?.value || "")
        .toLowerCase();


    const position =
        $("#positionFilter")?.value
        ||
        "ALL";


    const minScore =
        Number(
            $("#minScore")?.value
            ||
            0
        );


    let html = "";


    GAMES.forEach(game => {

        const gamePlayers =
            game.players
            .map(
                byId
            )
            .filter(
                Boolean
            );


        const visible =
            gamePlayers.some(player => {

                return (
                    (
                        position === "ALL"
                        ||
                        player.position === position
                    )
                    &&
                    (
                        Number(
                            player.outlook || 0
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
            });


        if (!visible) {
            return;
        }


        const teams =
            [...new Set(

                gamePlayers.map(
                    p => p.team
                )

            )];


        html += `

        <article class="game-card">

            <div class="game-summary">

                <div class="game-top">

                    <div>

                        <div class="matchup">
                            ${game.matchupLabel}
                        </div>

                        <div class="game-meta">

                            <span class="pill">
                                ${fmt(game.gameDate)}
                            </span>

                            <span class="pill">
                                ${fmt(game.gameTime)}
                            </span>

                            <span class="pill">
                                Total ${fmt(game.total)}
                            </span>

                        </div>

                    </div>


                    <div>

                        <div
                            class="
                                score
                                ${gclass(
                                    game.environmentGrade
                                )}
                            "
                        >
                            ${round1(
                                game.environmentScore
                            )}/100
                        </div>

                        <div class="player-sub">
                            Game Environment Rating
                        </div>

                    </div>

                </div>

            </div>


            <div class="expand">

                <div class="teams">

                    ${teams
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
    });


    $("#games").innerHTML =
        html
        ||
        `
        <div class="privacy-note">
            No games match the current filters.
        </div>
        `;


    $$(".game-summary").forEach(
        element => {

            element.onclick = () => {

                element
                    .parentElement
                    .classList
                    .toggle(
                        "open"
                    );
            };
        }
    );


    $$(".posbtn").forEach(
        element => {

            element.onclick = () => {

                element
                    .nextElementSibling
                    .classList
                    .toggle(
                        "open"
                    );
            };
        }
    );


    $$(".detail-btn").forEach(
        element => {

            element.onclick = () => {

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
// TEAM CARD
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
            p =>
                p.team === team
        );


    const opponent =
        teamPlayers[0]?.opponent
        ||
        "";


    const teamEnvironmentValues =
        teamPlayers
        .filter(
            p => p.headlineEligible
        )
        .map(
            p => Number(
                p.gameEnvironment
            )
        )
        .filter(
            Number.isFinite
        );


    const environmentScore =
        teamEnvironmentValues.length
            ? (
                teamEnvironmentValues.reduce(
                    (a, b) => a + b,
                    0
                )
                /
                teamEnvironmentValues.length
            )
            : 50;


    const environmentGrade =
        grade(
            environmentScore
        );


    // --------------------------------------------------------
    // PUBLIC MATCHUP ATTACK RATINGS
    //
    // This is simply the average published matchup rating
    // for headline players at that position.
    //
    // No internal model formula is exposed.
    // --------------------------------------------------------

    const attack = [
        "QB",
        "RB",
        "WR",
        "TE"
    ]
    .map(pos => {

        const players =
            teamPlayers.filter(
                p =>
                    p.position === pos
                    &&
                    p.headlineEligible
            );


        const values =
            players
            .map(
                p => Number(
                    p.matchup
                )
            )
            .filter(
                Number.isFinite
            );


        const score =
            values.length
                ? (
                    values.reduce(
                        (a, b) => a + b,
                        0
                    )
                    /
                    values.length
                )
                : null;


        return `

        <div class="attack">

            <span>
                ${pos}
            </span>

            <strong
                class="
                    ${gclass(
                        grade(score)
                    )}
                "
            >
                ${
                    score === null
                        ? "—"
                        : `${round1(score)}`
                }
            </strong>

        </div>
        `;
    })
    .join("");


    const sections = [
        "QB",
        "RB",
        "WR",
        "TE"
    ]
    .filter(
        pos =>
            positionFilter === "ALL"
            ||
            pos === positionFilter
    )
    .map(pos => {

        const players =
            teamPlayers
            .filter(player => {

                return (
                    player.position === pos
                    &&
                    (
                        Number(
                            player.outlook || 0
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
            })
            .sort(
                (a, b) => {

                    // Headline players first

                    if (
                        a.headlineEligible
                        !==
                        b.headlineEligible
                    ) {

                        return (
                            a.headlineEligible
                                ? -1
                                : 1
                        );
                    }


                    return (
                        Number(
                            b.outlook || 0
                        )
                        -
                        Number(
                            a.outlook || 0
                        )
                    );
                }
            );


        if (!players.length) {
            return "";
        }


        return `

        <button class="posbtn">

            ${pos} · ${players.length} players

        </button>


        <div class="player-list">

            ${players
                .map(
                    renderPlayer
                )
                .join("")
            }

        </div>
        `;
    })
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
                        ${gclass(
                            environmentGrade
                        )}
                    "
                >
                    ${round1(
                        environmentScore
                    )}
                </div>

                <div class="player-sub">
                    Environment Rating
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
// PLAYER CARD
// ============================================================

function renderPlayer(player) {

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
    .map(metric => `

        <div class="metric">

            <span>
                ${metric[0]}
            </span>

            <strong
                class="
                    ${gclass(
                        metric[2]
                    )}
                "
            >
                ${round1(
                    metric[1]
                )}/100
            </strong>

        </div>
    `)
    .join("");


    const headlineBadge =
        player.headlineEligible
            ? `
                <span class="pill">
                    Headline Role
                </span>
              `
            : `
                <span class="pill">
                    Extended Player
                </span>
              `;


    const confidence =
        player.confidenceBadge
        ||
        "Early Season";


    const role =
        player.role
        ||
        "Role TBD";


    const changedTeam =
        player.changedTeam
            ? `
                <div>
                    • New team for 2026
                </div>
              `
            : "";


    const positionReview =
        player.positionChangeReview
            ? `
                <div>
                    • Position classification flagged for review
                </div>
              `
            : "";


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
                    · ${role}
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
                        ${gclass(
                            player.outlookGrade
                        )}
                    "
                >
                    ${round1(
                        player.outlook
                    )}/100
                </div>

                <div class="player-sub">
                    Launch Lab Rating
                </div>

            </div>

        </div>


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


        <div class="metric-grid">

            ${metrics}

        </div>


        <button class="detail-btn">

            Rating details / Advanced view ▾

        </button>


        <div class="details">

            <div>
                V2 Player Outlook:
                <strong>
                    ${round1(
                        player.outlook
                    )}/100
                </strong>
            </div>


            <div>
                V1 Launch Score:
                <strong>
                    ${round1(
                        player.v1
                    )}/100
                </strong>
            </div>


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


            ${changedTeam}

            ${positionReview}


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

        </div>

    </div>
    `;
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNav() {

    $$(".navbtn").forEach(
        button => {

            button.onclick = () => {

                $$(".navbtn").forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                $$(".tabpage").forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                const page =
                    $("#" + button.dataset.tab);


                if (page) {

                    page.classList.add(
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
    .forEach(id => {

        const element =
            $("#" + id);


        if (!element) {
            return;
        }


        element.addEventListener(

            id === "search"
                ? "input"
                : "change",

            renderGames
        );
    });
}


// ============================================================
// RANKINGS
// ============================================================

const rankDefs = {

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


function renderRankings(key) {

    const tabs =
        $("#rankingTabs");


    if (!tabs) {
        return;
    }


    tabs.innerHTML =

        Object.entries(
            rankDefs
        )
        .map(
            ([rankKey, value]) => `

                <button
                    data-rank="${rankKey}"
                    class="
                        ${
                            rankKey === key
                                ? "active"
                                : ""
                        }
                    "
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

                button.onclick = () => {

                    renderRankings(
                        button.dataset.rank
                    );
                };
            }
        );


    const rankFunction =
        rankDefs[key][1];


    // --------------------------------------------------------
    // MAIN RANKINGS USE HEADLINE PLAYERS
    // --------------------------------------------------------

    const rows =
        PLAYERS

        .filter(
            player =>
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
        )

        .sort(
            (a, b) =>
                b[1] - a[1]
        )

        .slice(
            0,
            50
        );


    $("#rankingsList").innerHTML =

        rows
        .map(
            ([player, score], index) => `

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
                            · ${player.role || ""}
                            · vs ${player.opponent}

                        </div>

                    </div>


                    <div
                        class="
                            score
                            small
                            ${gclass(
                                grade(score)
                            )}
                        "
                    >
                        ${round1(
                            score
                        )}/100
                    </div>


                    <div class="hide-mobile">
                        ${player.confidenceBadge || ""}
                    </div>


                    <div class="hide-mobile player-sub">

                        Outlook
                        ${round1(
                            player.outlook
                        )}/100

                    </div>

                </div>
            `
        )
        .join("");
}


// ============================================================
// MODEL PERFORMANCE TAB
// ============================================================

function renderPerformance() {

    const fantasy =
        $("#perfFantasy");


    const props =
        $("#perfProps");


    if (fantasy) {

        fantasy.innerHTML = `

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


    if (props) {

        props.innerHTML = `

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
