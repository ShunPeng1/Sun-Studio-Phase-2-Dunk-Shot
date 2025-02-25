import { Scene, GameObjects } from "phaser"
import AssetManager from "../managers/AssetManager"
import BasketballHoop from "../entities/hoops/BasketballHoop"

import DunkShotGameInputHandler from "../input-handlers/DunkShotGameInputHandler"
import Ball from "../entities/balls/Ball"
import HoopSpawner from "../entities/hoops/HoopSpawner"
import HoopSpawnSet from "../entities/hoops/HoopSpawnSet"
import HoopSpawnInfo from "../entities/hoops/HoopSpawnInfo"
import HoopFactory from "../entities/hoops/HoopFactory"
import BoundaryImageTrajectory from "../entities/trajectories/BoundaryImageTrajectory"
import ScoreText from "../entities/scores/ScoreText"
import ScoreCounter from "../entities/scores/ScoreCounter"
import LoseBoundaryImage from "../entities/boundaries/LoseBoundaryImage"
import DunkShotGameStateManager from "../managers/DunkShotGameStateManager"
import ScoreManager from "../managers/ScoreManager"
import ScorePopupText from "../entities/scores/ScorePopupText"
import StarText from "../entities/scores/StarText"
import CollectibleFactory from "../entities/collectibles/CollectibleFactory"
import CollectibleSpawnInfo from "../entities/collectibles/CollectibleSpawnInfo"
import GoldenStarCollectible from "../entities/collectibles/GoldenStarCollectible"
import InventoryManager from "../managers/InventoryManager"
import WallBoundaryImage from "../entities/boundaries/WallBoundaryImage"
import BallParticle from "../entities/balls/BallParticle"
import BallSpeaker from "../entities/sounds/BallSpeaker"
import BallInteraction from "../entities/balls/BallInteraction"
import ObstacleFactory from "../entities/boundaries/ObstacleFactory"
import ObstacleSpawnInfo from "../entities/boundaries/ObstacleSpawnInfo"
import SmallLineObstacleBoundaryImage from "../entities/boundaries/SmallLineObstacleBoundaryImage"
import MediumLineObstacleBoundaryImage from "../entities/boundaries/MediumLineObstacleBoundaryImage"
import LongLineObstacleBoundaryImage from "../entities/boundaries/LongLineObstacleBoundaryImage"
import CircleObstacleBoundaryImage from "../entities/boundaries/CircleObstacleBoundaryImage"

class DunkShotGameScene extends Scene {

    protected ballSpawnPlace: Phaser.Math.Vector2 = new Phaser.Math.Vector2(150, 450)
    protected ball: Ball
    protected invisibleBallFollower: GameObjects.Graphics
    protected ballInteraction: BallInteraction
    protected scoreCounter: ScoreCounter

    private readonly PHYSICS_FPS: number = 300
    

    private coinUpdateFuction: (old: string, value: string) => void

    constructor(key: string = AssetManager.DUNK_SHOT_GAME_SCENE) {
        super({ key: key })
    }

    private create() {
        this.setupGame()

        // Configure the game UI and style
        
        this.setupGameStyle()
        this.setupGameFeel()
        this.setupGameUI()
    }

    private setupGame() : void {
        this.setupPhysics()
        this.setupBall()
        this.setupInputHandler()
        this.setupBoundaries()
        this.setupCamera()
        this.setupScoreManagement()
    }

    protected setupGameFeel() : void {
        this.setupScorePopupText()
        this.setupParticle()
        this.setupSound()
    }

    protected setupGameUI() : void {
        this.setupScoreBackgroundText()
        this.setupStarManagement()
    }

    protected setupGameStyle() : void {
        this.setupGameStateManager()
        this.setupHoops()
    }
    
    private setupPhysics() : void {
        this.physics.world.setFPS(this.PHYSICS_FPS)
        this.physics.world.setBounds(0, 0, AssetManager.WORLD_WIDTH, AssetManager.WORLD_HEIGHT)
    }


    private setupCamera() : void {
    
        // Set the background color to white
        const camera = this.cameras.main
        camera.setBackgroundColor('#e8e8e8')
        camera.zoom = camera.width / AssetManager.WORLD_WIDTH
        //camera.zoom = 0.5

        // Camera follow settings
        camera.startFollow(this.invisibleBallFollower, true, 0, 0.01, -AssetManager.WORLD_WIDTH/2, 100)
        
    }

    private setupBoundaries() : void {
        
        const leftBound = new WallBoundaryImage(this, 0, 0, true)
        const rightBound = new WallBoundaryImage(this, 0, 0, false)

        
        leftBound.setPosition(0, -WallBoundaryImage.BOUND_HEIGHT + AssetManager.WORLD_HEIGHT*2)
        leftBound.setOffset(WallBoundaryImage.BOUND_WIDTH/2, 0)
        rightBound.setPosition(AssetManager.WORLD_WIDTH, -WallBoundaryImage.BOUND_HEIGHT + AssetManager.WORLD_HEIGHT*2)
        rightBound.setOffset(WallBoundaryImage.BOUND_WIDTH*2, 0)
        
        
        leftBound.enableCollision(this.ball, this.ball.wallCollisionCallback)
        rightBound.enableCollision(this.ball, this.ball.wallCollisionCallback)

    }

    private setupBall() : void {
        this.ball = new Ball(this, this.ballSpawnPlace.x, this.ballSpawnPlace.y, AssetManager.BASKETBALL_KEY)
        this.ball.setScale(0.2)
        this.ball.setDrag(0)
        this.ball.setFriction(0)
        this.ball.setAngularDrag(0)

        this.invisibleBallFollower = this.add.graphics()
        this.invisibleBallFollower.setVisible(false)
        this.invisibleBallFollower.setY(600)

        this.ballInteraction = new BallInteraction(this.ball)

       
    }


    private setupInputHandler() : void {
        

        const inputHandler = new DunkShotGameInputHandler(this, this.ball, 
            new BoundaryImageTrajectory(this, this.ball.arcadeBody, 4000, 176, 16, AssetManager.TRAJECTORY_KEY, 0xff9500, 0.15))
        const firstHoop = this.ballInteraction.getFirstHoop()
        if (firstHoop) {
            inputHandler.setCurrentHoop(firstHoop)
        }

    }

    private setupScoreManagement() : void {
        
        ScoreManager.getInstance().resetScore()
        const scoreCounter = new ScoreCounter(this.ballInteraction)
        this.scoreCounter = scoreCounter
        

    }

    protected setupScoreBackgroundText() : void {

        
        const scoreText = new ScoreText(
            this, 
            this.cameras.main.width / 2, // X position: Middle of the screen
            this.cameras.main.height / 3.5, // Y position: Middle of the screen
            '0', 
            { 
                fontSize: 'bold 150px', 
                fontFamily: 'Arial', // Specify a bold font family
                color: '#c6c6c6', // Example color: white
                align: 'center' // Ensure the text is centered
            }
        )
        scoreText.setOrigin(0.5, 0.5) // Center the origin of the text for accurate positioning
        scoreText.setDepth(-5)
        scoreText.setScrollFactor(0, 0) // This line makes the score text follow the camera
    
        
        this.scoreCounter.on(this.scoreCounter.SCORE_UPDATE_EVENT, (totalScore : number, score: number, prefectCount : number, isBounceWall : boolean) => {
            scoreText.updateScore(totalScore)
            //console.log("Total Score ", totalScore,"Score: ", score, " Prefect Count: ", prefectCount, " Bounce Wall: ", isBounceWall);
        })


    }

    protected setupScorePopupText() : void {
        const scorePopupText = new ScorePopupText(this, this.ball, this.scoreCounter)
    }

    protected setupStarManagement() : void {
        const starText = new StarText(this, 500, 150, '0', { 
            fontSize: 'bold 40px', 
            fontFamily: 'Arial', // Specify a bold font family
            color: '#f2a63b', // Example color: white
            align: 'center' // Ensure the text is centered
            }
        )

        starText.setScale(0.6)
        starText.setOrigin(0.5, 0.5) // Center the origin of the text for accurate positioning
        starText.setScrollFactor(0, 0) // This line makes the score text follow the camera
   
        starText.updateStar(InventoryManager.getInstance().getItemAsNumber(AssetManager.GOLDEN_STAR_INVENTORY_KEY))
        
        this.ball.on(this.ball.COLLECTIBLE_OVERLAP_EVENT, (collectible: GoldenStarCollectible) => {
            
            if (collectible instanceof GoldenStarCollectible) {
                starText.updateStar(InventoryManager.getInstance().getItemAsNumber(AssetManager.GOLDEN_STAR_INVENTORY_KEY))
                const collectibleEndPosition = new Phaser.Math.Vector2(starText.x + this.cameras.main.scrollX - 45, starText.y + this.cameras.main.scrollY)
                collectible.createCollectAnimation(new Phaser.Math.Vector2(collectibleEndPosition))
            }
        })

        
        const coinUpdate = (old: string, value: string): void =>{
            starText.updateStar(parseInt(value))
        }

        this.coinUpdateFuction = coinUpdate.bind(this)

        InventoryManager.getInstance().subscribe(AssetManager.GOLDEN_STAR_INVENTORY_KEY, this.coinUpdateFuction)

        starText.on('destroy', () => {
            InventoryManager.getInstance().unsubscribe(AssetManager.GOLDEN_STAR_INVENTORY_KEY, this.coinUpdateFuction)
        })

    }




    protected setupParticle() : void {
        const ballParticle = new BallParticle(this, "", this.ball, this.ballInteraction, this.invisibleBallFollower)
        
        this.add.existing(ballParticle)
    }

    protected setupSound() : void {
        const ballSpeaker = new BallSpeaker(this, this.ball, this.ballInteraction)
    }

    
    protected setupHoops() : void {
        
        const hoopFactory = new HoopFactory(this, 0xea4214, 0.5)
        const collectibleFactory = new CollectibleFactory(this)
        const obstacleFactory = new ObstacleFactory(this)
        const hoopSpawner = new HoopSpawner(this, this.ball, new HoopSpawnSet(
            [
                new HoopSpawnInfo.Builder(BasketballHoop)
                .setSpawnType("RANDOM")
                .setMinOffset(new Phaser.Math.Vector2(120, -150))
                .setMaxOffset(new Phaser.Math.Vector2(500, -250))
                .setRotationVariance(new Phaser.Math.Vector2(-Math.PI/6, Math.PI/6))
                .setSpawnChance(1)
                .build()
            ], [
                new CollectibleSpawnInfo(GoldenStarCollectible, 1, -40, 0.5)
            ], [
                new ObstacleSpawnInfo(SmallLineObstacleBoundaryImage, 1, "NEXT TO VERTICAL"),
                new ObstacleSpawnInfo(LongLineObstacleBoundaryImage, 1, "TOP HORIZONTAL"),
                new ObstacleSpawnInfo(MediumLineObstacleBoundaryImage, 1, "SIDE HORIZONTAL"),
                new ObstacleSpawnInfo(MediumLineObstacleBoundaryImage, 1, "TOP VERTICAL"),
                new ObstacleSpawnInfo(SmallLineObstacleBoundaryImage, 1, "SIDE VERTICAL"),
                new ObstacleSpawnInfo(CircleObstacleBoundaryImage, 1, "TOP HORIZONTAL"),
                new ObstacleSpawnInfo(CircleObstacleBoundaryImage, 1, "NEXT TO VERTICAL"),
                new ObstacleSpawnInfo(CircleObstacleBoundaryImage, 1, "SIDE VERTICAL"),

            ],
            0.15,
            0.2,
            ),
            hoopFactory,
            collectibleFactory,
            obstacleFactory,
            90, 
            440)
        


        const hoop1 = hoopFactory.createHoop(BasketballHoop, 150, 600)
        
        this.add.existing(hoop1)
        hoop1.enableOverlap(this.ball, this.ball.internalHoopOverlapCallback)
        hoop1.enableCollision(this.ball, this.ball.hoopCollisionCallback)


        const hoop2 = hoopFactory.createHoop(BasketballHoop, 350, 500)
        
        this.add.existing(hoop2)
        hoop2.enableOverlap(this.ball, this.ball.internalHoopOverlapCallback)
        hoop2.enableCollision(this.ball, this.ball.hoopCollisionCallback)


        // Set the first and next hoop for the ball interaction
        this.ballInteraction.setFirstHoop(hoop1)
        this.ballInteraction.setNextHoop(hoop2)
        this.ballInteraction.on(BallInteraction.ENTER_NEXT_HOOP_EVENT, (enterHoop: BasketballHoop, lastHoop : BasketballHoop, perfectCount: number, bounceCount: number, isBounceWall: boolean, isBounceRing: boolean) => {
            if (lastHoop) {
                lastHoop.destroy()
            }

            const nextHoop = hoopSpawner.spawnNextHoop(enterHoop)
            this.ballInteraction.advanceNextHoop(nextHoop)
        })

    }

    protected initializeHoop(hoop : BasketballHoop): void{
        hoop.setRingTint(0xea4214)
        hoop.setScale(0.5)
        hoop.enableOverlap(this.ball, this.ball.internalHoopOverlapCallback)
        hoop.enableCollision(this.ball, this.ball.hoopCollisionCallback)
    }
    
    protected setupGameStateManager(){
        
        const gameStateManager = new DunkShotGameStateManager(this)
        gameStateManager.loadStartUI()


        const loseBoundaryImage = new LoseBoundaryImage(this, 20, 1500, AssetManager.WORLD_WIDTH, 100, 0, 1000, this.ballInteraction)
        loseBoundaryImage.enableOverlap(this.ball, (ball: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, loseBoundaryImage: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
            
            if (ball instanceof Ball && loseBoundaryImage instanceof LoseBoundaryImage) {
                const firstHoop = this.ballInteraction.getFirstHoop()
                
                if (firstHoop){
                    ball.setPosition(this.ballSpawnPlace.x, this.ballSpawnPlace.y)
                    ball.stableBall()
                    // Tween the hoop's rotation to 0
                    this.tweens.add({
                        targets: firstHoop,
                        values: {from: firstHoop.getRotation(), to: 0}, 
                        ease: 'Linear',
                        duration: 100,
                        onComplete: () => {
                            // After the rotation tween completes, set the ball's position and velocity
                            ball.setPosition(this.ballSpawnPlace.x, this.ballSpawnPlace.y)
                            ball.pushBall(100, 100, Math.PI/2)
                        },
                        onUpdate: (tween) => {
                            // Update the hoop's rotation during the tween
                            const value = tween.getValue()
                            firstHoop?.setRotation(value)
                        }
                    })
                    
                }
                else {
                    loseBoundaryImage.disableBody()
                    ScoreManager.getInstance().saveHighScore()
                    
                    gameStateManager.loadLoseUI()
                }
            }
        })

    }

    update() {
        this.followBall()

    }

    private followBall() : void {
        const ballWorldPosition = this.ball.getWorldPosition()

        // Update the invisible object's position to follow the ball
        this.invisibleBallFollower.x = ballWorldPosition.x
        this.invisibleBallFollower.y = ballWorldPosition.y
    }

}



export default DunkShotGameScene