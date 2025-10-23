import { GameState } from "./GameState";
import { WebSocket } from "ws";

export class Player{

    public id: string;
    public name: string;
    public client: WebSocket | null;
    public ready: boolean;
    public mushrooms: number;
    public alive: boolean;
    public handCards: boolean[];
    public handCardsNumber: number;
    public boardCards: boolean[];
    public publicBoardCard: number;
    public inactiveCards: boolean[];
    public canPlay: boolean;
    public canKill: boolean;
    public constructor(id?: string, name?: string, client?: WebSocket, ready?: boolean, mushrooms?: number, alive?: boolean, handCards?: boolean[], handCardsNumber?: number, boardCards?: boolean[], publicBoardCard?: number, inactiveCards?: boolean[], canPlay?: boolean, canKill?: boolean) {
        this.id = id || "";
        this.name = name || "";
        this.client = client || null;
        this.ready = ready || false;
        this.mushrooms = mushrooms || 0;
        this.alive = alive || true;
        this.handCards = handCards || [true, true, true, true, true];
        this.handCardsNumber = handCardsNumber || 5;
        this.boardCards = boardCards || [false, false, false, false, false];
        this.publicBoardCard = publicBoardCard || -1;
        this.inactiveCards = inactiveCards || [false, false, false, false, false];
        this.canPlay = canPlay || false;
        this.canKill = canKill || false;
    }

    public Play(choice: number) {
        //const choice = Number(prompt(`${this.name}: Play a card among ${this.getHandCards()}`))
        if (this.handCards[choice] == true) {
            this.handCards[choice] = false; this.handCards = this.handCards;
            this.boardCards[choice] = true; this.boardCards = this.boardCards;
        }
        else {
            console.error(`${this.constructor.name}.Play`);
        }
        this.handCardsNumber = this.getHandCardsNumber();
    }

    public Kill(gameState: GameState, choice: number) {
        if (this.alive == true) {
            //const choice = Number(prompt(`${this.name}: Kill players (selectable : ${gameState.getKillableCards()})`));
            if (choice > gameState.cardValue && gameState.deadCards[choice] == false) {
                gameState.deadCards[choice] = true; gameState.deadCards = gameState.deadCards;
                for (const player of gameState.players) {
                    if (player.boardCards[choice] == true) {
                        player.alive = false;
                    }
                }
            }
            else {
                console.error(`${this.constructor.name}.Kill`);
            }
        }
    }

    public getHandCards() {
        let handCards = [];
        for (const index in this.handCards) {
            if (this.handCards[index] == true) handCards.push(Number(index));
        }
        return handCards;
    }

    public updateInactive() {
        if (this.alive == true) {
            let cardOnBoard = -1;
            for (const index in this.boardCards) {
                if (this.boardCards[index] == true) cardOnBoard = Number(index);
            }
            this.boardCards[cardOnBoard] = false; this.boardCards = this.boardCards;
            this.inactiveCards[cardOnBoard] = true; this.inactiveCards = this.inactiveCards;
        }
        else {
            this.boardCards = [false, false, false, false, false];
            this.inactiveCards = [false, false, false, false, false];
        }

    }

    public getHandCardsNumber(){
        return this.handCards.filter((handCard) => handCard == true).length;
    }

    public getPublicBoardCard(gameState: GameState){
        let currentBoardCards = [];
        for (const index in this.boardCards) {
            if (this.boardCards[index] == true) currentBoardCards.push(Number(index));
        }
        let boardCard = currentBoardCards[0]
        if (boardCard != undefined && this.alive == true && gameState.cardValue >= boardCard){
            return boardCard; 
        }
        else{
            return -1;
        }
    }

    public getScore() {
        let score = 0;
        for (const index in this.inactiveCards) {
            if (this.inactiveCards[index] == true) {
                score += Number(index) + 1;
            }
        }
        return score;
    }

}