import LoadingScene from "./scenes/LoadingScene"
import MainMenuUIScene from "./scenes/MainMenuUIScene"
import DunkShotGameScene from "./scenes/DunkShotGameScene"
import RestartUIScene from "./scenes/RestartUIScene"
import DunkShotGameUIScene from "./scenes/DunkShotGameUIScene"
import PauseUIScene from "./scenes/PauseUIScene"
import CustomizeUIScene from "./scenes/CustomizeUIScene"
import ChallengeMenuScene from "./scenes/ChallengeMenuScene"
import ChallengeGameScene from "./scenes/ChallengeGameScene"
import ChallengeStartUIScene from "./scenes/ChallengeStartUIScene"
import ChallengeLoseUIScene from "./scenes/ChallengeLoseUIScene"
import ChallengePauseUIScene from "./scenes/ChallengePauseUIScene"
import ChallengeWinUIScene from "./scenes/ChallengeWinUIScene"


class Game {
    constructor() {
        // Desired aspect ratio (width:height)
        const aspectRatio = 9 / 16
        
        const gameWidth = 600, gameHeight = gameWidth / aspectRatio


        const config = {
            type: Phaser.AUTO,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            scale: {
                mode: Phaser.Scale.FIT,
                width: gameWidth,
                height: gameHeight
            },
            scene: [
                LoadingScene, 
                DunkShotGameScene, 
                MainMenuUIScene, 
                RestartUIScene, 
                DunkShotGameUIScene, 
                PauseUIScene, 
                CustomizeUIScene,

                ChallengeMenuScene,
                ChallengeGameScene,
                ChallengeStartUIScene,
                ChallengeLoseUIScene,
                ChallengeWinUIScene,
                ChallengePauseUIScene
            ],
            physics: {
                default: 'arcade',
                arcade: {
                    debug: true,
                    gravity: {x: 0, y: 1500 }
                }
            }
            
        }


        const game = new Phaser.Game(config)
    }

}

new Game()
