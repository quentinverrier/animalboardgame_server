import { Player } from "../game/Player";

export class GameState {

    public players: Player[];
    public started: boolean;
    public mushroomThreshold: number;
    public round: number;
    public turn: number;
    public cardValue: number;
    public leftToPlay: number;
    public deadCards: boolean[];
    public winner: boolean;
    public constructor(players?: Player[], started?: boolean, mushroomThreshold?: number, round?: number, turn?: number, cardValue?: number, leftToPlay?: number, deadCards?: boolean[], winner?: boolean) {
        this.players = players || [];
        this.started = started || false;
        this.mushroomThreshold = mushroomThreshold || 5;
        this.round = round || 0;
        this.turn = turn || 0;
        this.cardValue = cardValue || 0;
        this.leftToPlay = leftToPlay || 0;
        this.deadCards = deadCards || [false, false, false, false, false];
        this.winner = winner || false;
    }

    public startGame() {
        this.winner = false;
        if (this.howManyReady() == this.players.length){
            this.round = 0;
            for (const player of this.players) {
                player.mushrooms = 0;
            }
            this.started = true;
            this.startRound();
        }
        else{
            console.log("Can't start game, some players are not ready!")
        }
    }

    public endGame() {
        this.winner = true;
        console.log(`BRAVO à ${this.getGameWinners().map((player) => player.name)}`)
    }

    public toLobby(){
        this.started = false;
        for(const player of this.players){
            player.ready = false;
        }
    }

    public startRound() {
        if (this.getGameWinners().length != 1) {
            this.round++;
            console.log(`Début du round ${this.round}...`);
            this.turn = 0;
            this.deadCards = [false, false, false, false, false];
            for (const player of this.players) {
                player.alive = true;
                player.handCards = [true, true, true, true, true];
                player.boardCards = [false, false, false, false, false];
                player.inactiveCards = [false, false, false, false, false];
                player.handCardsNumber = player.getHandCardsNumber();
            }
            this.startTurn();
        }
        else {
            this.endGame();
        }
    }

    public startTurn() {
        this.turn++;
        console.log(`Début du tour ${this.turn}...`)
        this.cardValue = -2;
        // for (const player of this.players) {
        //     const cardPlayed = player.boardCards.findIndex((boardCard) => boardCard == true);
        //     player.inactiveCards[cardPlayed] = true;
        //     player.boardCards = [false, false, false, false, false];
        // }
        if (this.turn <= 3 && this.howManyAlive() > 1) {
            console.log(`${this.howManyAlive()} en vie...`)
            this.deadCards = [false, false, false, false, false];
            this.playStep();
        }
        else {
            this.distributeMushrooms();
            this.startRound();
        }
    }

    public playStep() {
        this.cardValue++;
        console.log(`cardValue= ${this.cardValue}...`)
        for (const player of this.players){
            player.publicBoardCard = player.getPublicBoardCard(this);
        }
        if (this.cardValue == -1) {
            for (const player of this.players) {
                if (player.alive == true) {
                    player.canPlay = true;
                }
            }
            this.leftToPlay = this.howManyAlive();
        }
        else if (this.cardValue == 5 || this.howManyAlive() == 1) {
            for (const player of this.players) {
                player.updateInactive();
            }
            this.startTurn();
        }
        else {
            const playersWhoPlayed = this.getPlayersWhoPlayed(this.cardValue);
            if (playersWhoPlayed.length == 1 && this.higherAreDead() == false) {
                if (playersWhoPlayed[0].alive == true) {
                    playersWhoPlayed[0].canKill = true;
                    this.leftToPlay = 1;
                }
                else {
                    this.playStep();
                }
            }
            else {
                this.playStep();
            }
        }
    }

    public getPlayersWhoPlayed(cardValue: number) {
        let playersWhoPlayed = [];
        for (const player of this.players) {
            if (player.boardCards[cardValue] == true) playersWhoPlayed.push(player);
        }
        return playersWhoPlayed;
    }

    public getKillableCards() {
        let killableCards = [];
        for (const index in this.deadCards) {
            if (this.deadCards[index] == false && Number(index) > this.cardValue) killableCards.push(index);
        }
        return killableCards;
    }

    public distributeMushrooms() {
        for (const player of this.players) {
            if (player.alive == true) {
                player.mushrooms++;
                console.log(`${player.name} a gagné 1 champi (total: ${player.mushrooms})`)
            }
            if (this.getRoundWinners().includes(player)) {
                player.mushrooms++;
                console.log(`${player.name} a gagné 1 champi (total: ${player.mushrooms})`)
            }
        }
    }

    public howManyAlive() {
        return this.players.filter((player) => player.alive == true).length;
    }

    public howManyReady() {
        return this.players.filter((player) => player.ready == true).length;
    }

    public getRoundWinners() {
        let maxScore = 0;
        for (const player of this.players) {
            let score = player.getScore();
            if (score >= maxScore && player.alive == true) {
                maxScore = score;
            }
        }
        let roundWinners = []
        for (const player of this.players) {
            let score = player.getScore();
            if (score == maxScore && player.alive == true) {
                roundWinners.push(player);
            }
        }
        return roundWinners;
    }

    public getGameWinners() {
        let maxMushrooms = 0;
        for (const player of this.players) {
            if (player.mushrooms >= maxMushrooms) {
                maxMushrooms = player.mushrooms;
            }
        }
        let gameWinners = []
        for (const player of this.players) {
            if (player.mushrooms == maxMushrooms && player.mushrooms >= this.mushroomThreshold) {
                gameWinners.push(player);
            }
        }
        return gameWinners;
    }

    public higherAreDead() {
        for (const player of this.players) {
            for (let value = this.cardValue + 1; value <= 4; value++) {
                if (this.getPlayersWhoPlayed(value).includes(player) && player.alive == true) {
                    return false;
                }
            }
        }
        return true;
    }

    public onPlay(choice: number, playerID: string) {
        let player = this.players.filter((player) => player.id == playerID)[0];
        if (player.canPlay == true && player.alive == true && this.leftToPlay > 0) {
            player.Play(choice);
            player.canPlay = false;
        }
        else if (player.alive == false) {
            console.error("Player is dead");
        }
        else if (player.canPlay == false) {
            console.error("Player can't play");
        }
        else if (this.leftToPlay == 0) {
            console.error("No player left to play");
        }
        this.leftToPlay--;
        if (this.leftToPlay == 0) {
            this.playStep();
        }
    }

    public onKill(choice: number, playerID: string) {
        let player = this.players.filter((player) => player.id == playerID)[0];
        if (player.canKill == true && player.alive == true && this.leftToPlay > 0) {
            player.Kill(this, choice);
            player.canKill = false;
        }
        else if (player.alive == false) {
            console.error("Player is dead");
        }
        else if (player.canPlay == false) {
            console.error("Player can't play");
        }
        else if (this.leftToPlay == 0) {
            console.error("No player left to play");
        }
        this.leftToPlay--;
        if (this.leftToPlay == 0) {
            this.playStep();
        }
    }

    public update(gameState: GameState){
        this.started = gameState.started;
        this.mushroomThreshold = gameState.mushroomThreshold;
        this.turn = gameState.turn;
        this.round = gameState.round;
        this.cardValue = gameState.cardValue;
        this.leftToPlay = gameState.leftToPlay;
        this.deadCards = gameState.deadCards;
        this.winner = gameState.winner;
        for (const index in gameState.players){
            if(!this.players[index]){
                this.players.push(new Player());
            }
            let playerToSend = this.players[index];
            let player = gameState.players[index];
            playerToSend.id = player.id;
            playerToSend.client = player.client;
            playerToSend.name = player.name;
            playerToSend.ready = player.ready;
            playerToSend.mushrooms = player.mushrooms;
            playerToSend.alive = player.alive;
            playerToSend.handCards = player.handCards;
            playerToSend.handCardsNumber = player.handCardsNumber;
            playerToSend.inactiveCards = player.inactiveCards;
            playerToSend.boardCards = player.boardCards;
            playerToSend.publicBoardCard = player.publicBoardCard;
            playerToSend.canPlay = player.canPlay;
            playerToSend.canKill = player.canKill;
        }
        this.players = [...this.players]
    }


}
