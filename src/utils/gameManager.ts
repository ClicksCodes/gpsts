import fs from "fs";
import axios from "axios";
import path from "path";


class Player {
    points: number;
    nickname: string;
    hand: string[];

    constructor() {
        this.points = 0;
        this.nickname = "";
        this.hand = [];
    }
}


class Deck {
    questions: string[];
    answers: string[];
    name: string;
    description: string;
    sfw: number;  // 0 = Fully SFW, 1 = Includes swearing, 2 = Some NSFW, 3 = Fully NSFW
    constructor(name, description, sfw, questions, answers) {
        this.name = name;
        this.description = description;
        this.sfw = sfw
        this.questions = questions;
        this.answers = answers;
    }
}


function handleDeckArray(s: string[]) {
    let name, description, sfw, version
    let questions = [];
    let answers = [];
    let cache = ["", []];
    s.map((card, index) => {
        if (index == 0) { version = card; return}
        if (index == 1) { name = card; return }
        if (index == 2) { description = card; return }
        if (index == 3) { sfw = card; return }
        if (card == "QUESTIONS:") { cache[0] = "q"; return }
        if (card == "ANSWERS:") { cache[0] = "a"; return }
        if (card == "") { return }

        if (cache[0] == "q") { questions.push(card); return }
        if (cache[0] == "a") { answers.push(card); return }
    })
    if (version !== "V1") { return undefined }
    return {name: name, description: description, sfw: sfw, questions: questions, answers: answers};
}


function getDeck(id: string): Deck | undefined {
    let location = id.split(".")
    if (id.startsWith("https://")) {
        try {
            axios.get(id).then(res => {
                let data = res.data;
                let lines = data.split("\n");
                let cards = handleDeckArray(lines);
                if (cards.questions && cards.answers && cards.sfw && cards.name && cards.description) {
                    return new Deck(cards.name, cards.description, cards.sfw, cards.questions, cards.answers);
                } else { return undefined }
            })
        } catch (e) {
            return undefined;
        }
    }

    if (location.length == 1) {
        if (fs.existsSync(`./src/packs/${id}.txt`)) {
            let cards: any = fs.readFileSync(`./src/packs/${id}.txt`, "utf8").split("\n");
            cards = handleDeckArray(cards);
            if (cards.questions && cards.answers && cards.name && cards.description) {
                return new Deck(cards.name, cards.description, cards.sfw, cards.questions, cards.answers);
            }
        } else { return undefined }
    }
}

// Judge picking methods
// 0 Random
// 1 Most points
// 2 Random, each player should be judge the same amount of times each
// 3 Weighted random, each player is more likely to be the judge if they have more points
// 5 The winner of the previous round is the judge


class Game {
    completedRounds: number;
    host: string;
    players: { [key: string]: Player };
    decks: Deck[];
    discards: string[];
    kicked: string[];
    blanks: number;
    timeouts: object;
    anonymous: boolean;
    maxPlayers: number;
    maxRounds: number;
    maxPoints: number;
    handSize: number;
    shuffles: number;
    judgePickMethod: number;
    public: boolean;
    password: string;

    constructor(userId) {
        this.completedRounds = 0;
        this.host = userId;
        this.players = {};
        this.discards = [];
        this.kicked = [];
        this.decks = [getDeck("base")];
        this.blanks = 0;
        this.timeouts = {
            choose: 150,
            vote: 300,
            roundDelay: 5
        };
        this.anonymous = false;
        this.maxPlayers = 50;
        this.maxRounds = 0;
        this.maxPoints = 7;
        this.handSize = 10;
        this.shuffles = 3;
        this.judgePickMethod = 0;
        this.public = false;
        this.password = null;
    }

    addPlayer(userId: string, nickname: string) {
        this.players[userId] = new Player();
        this.players[userId].nickname = nickname;
    }

    removePlayer(userId: string) {
        delete this.players[userId];
    }
}


export default class GameManager {
    client: null;
    games: object;

    constructor(client) {
        this.client = client;
        this.games = {};
    }

    fetch(channelId: string): Game | null {
        return this.games[channelId] || null;
    }

    create(channelId: string, userId: string): Game {
        if (this.games[channelId]) {
            return null;
        }
        let game = new Game(userId)
        this.games[channelId] = game;
        return game;
    }
}