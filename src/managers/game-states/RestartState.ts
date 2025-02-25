import { Scene } from "phaser"
import AssetManager from "../AssetManager"
import GameState from "./GameState"
import DunkShotGameStateManager from "../DunkShotGameStateManager"
import IStateTransitionData from "../../utilities/state-machines/IStateTransitionData"

class RestartState extends GameState {

    constructor(scene: Scene, gameStateManager: DunkShotGameStateManager) {
        super(scene, gameStateManager, AssetManager.RESTART_UI_SCENE)
    }

    public enterState(enterTransitionData: IStateTransitionData | null): void {
        
        this.scene.cameras.main.stopFollow()

        this.scene.scene.launch(this.sceneName, this.gameStateManager)
        this.scene.scene.bringToTop(this.sceneName)
    }
}


export default RestartState