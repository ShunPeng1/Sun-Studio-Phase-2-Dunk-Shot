import { GameObjects } from "phaser"
import BoundaryImage from "../boundaries/BoundaryImage"
import BasketballHoop from "../hoops/BasketballHoop"
import InternalHoopArcadeImage from "../hoops/InternalHoopArcadeImage"
import RingHoopArcadeImage from "../hoops/RingHoopArcadeImage"
import NetArcadeImage from "../hoops/NetArcardImage"
import InventoryManager from "../../managers/InventoryManager"
import AssetManager from "../../managers/AssetManager"

class Ball extends Phaser.Physics.Arcade.Sprite {
    public readonly arcadeBody: Phaser.Physics.Arcade.Body

    private worldX: number
    private worldY: number

    private bindingHoop: BasketballHoop | null = null
    private lastBindingHoop: BasketballHoop | null = null
    private wasBlocked = false
    
    public readonly INTERNAL_HOOP_OVERLAP_START_EVENT = "internal hoop overlapstart"
    public readonly INTERNAL_HOOP_OVERLAP_END_EVENT = "internal hoop overlapend"
    public readonly RING_HOOP_COLLIDE_EVENT = "collide with ring hoop"
    public readonly WALL_COLLIDE_EVENT = "collide with wall"
    public readonly NET_COLLIDE_EVENT = "collide with net"
    public readonly COLLECTIBLE_OVERLAP_EVENT = "collide with collectible"
    public readonly BALL_PUSH_EVENT = "ball push"

    private readonly BLOCKED_COOLDOWN = 300

    private ballSkinFunction : (old :string, skin: string) => void

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture) {
        super(scene, x, y, texture)
        
        this.scene.add.existing(this)
        this.scene.physics.add.existing(this)
        this.setCircle(this.width /2)
        this.setDepth(0)
        this.setBounce(1)
        

        this.worldX = x
        this.worldY = y

        this.arcadeBody = this.body as Phaser.Physics.Arcade.Body

        // Add this Ball instance to the scene's update list
        this.scene.events.on('update', this.update, this)

        // Note: It's important to remove the event listener when the Ball is destroyed
        // to prevent memory leaks or unexpected behavior
        this.on('destroy', () => {
            this.scene.events.off('update', this.update, this)
            InventoryManager.getInstance().unsubscribe(AssetManager.BALL_SKIN_INVENTORY_KEY, this.ballSkinFunction)
        })


        this.on(this.WALL_COLLIDE_EVENT, this.adjustBounceOnCollidingObject, this)
        this.on(this.RING_HOOP_COLLIDE_EVENT, this.adjustBounceOnCollidingObject, this)
        this.on(this.NET_COLLIDE_EVENT, this.adjustBounceOnCollidingObject, this)

        this.ballSkinFunction = this.setBallSkin.bind(this)

        this.setTexture(InventoryManager.getInstance().getItem(AssetManager.BALL_SKIN_INVENTORY_KEY) ?? AssetManager.BASKETBALL_KEY) 
        InventoryManager.getInstance().subscribe(AssetManager.BALL_SKIN_INVENTORY_KEY, this.ballSkinFunction)

        //InventoryManager.getInstance().setItem(AssetManager.GOLDEN_STAR_INVENTORY_KEY, "1000");
    }

    public update() : void {
        if (this.bindingHoop){
            const internalHoopPosition = this.bindingHoop.getInternalHoopWorldPosition()
            this.worldX = internalHoopPosition.x
            this.worldY = internalHoopPosition.y         
            
            
            //this.x = 0;
            //this.y = 0;
        }
        else {
            this.worldX = this.x
            this.worldY = this.y
        }


        if (!this.getIsBinded() && this.getWasBinded() && this.arcadeBody.overlapR === 0){
            
            this.endOverlap()
            this.emit("internal hoop overlapend", this.bindingHoop)
        
        }

        if (this.getWasBlocked()){
            setTimeout(() => {
                this.setWasBlocked(false)
            }, this.BLOCKED_COOLDOWN)
        }
          
    }

    private setBallSkin(old :string, skin: string) : void {
        this.setTexture(skin)
    }

    public bindBall(basketballHoop : BasketballHoop) : void{    
        this.bindingHoop = basketballHoop

        const internalHoopPosition = basketballHoop.getInternalHoopWorldPosition()
        this.worldX = internalHoopPosition.x
        this.worldY = internalHoopPosition.y
        
    }

    public unbindBall() : void{
        this.lastBindingHoop = this.bindingHoop

        this.bindingHoop = null

        //this.setImmovable(false);
    
        //this.setPosition(this.worldX, this.worldY);


    }

    public endOverlap() : void{
        this.lastBindingHoop = null
    }

    public getIsBinded() : boolean{
        return this.bindingHoop !== null
    }

    public getWasBinded() : boolean{
        return this.lastBindingHoop !== null
    }


    public pushBall(force: number, angularForce : number, angle: number): void {
        this.arcadeBody.setAllowGravity(true)
    
        // Calculate horizontal and vertical components of the force
        const horizontalForce = force * Math.cos(angle)
        const verticalForce = force * Math.sin(angle)
    
        // Set the velocity of the ball
        this.setVelocity(horizontalForce, verticalForce)
    
        // Determine the direction for the angular velocity based on the horizontal movement
        // If moving left (negative horizontal force), rotate counterclockwise, and vice versa
        const angularVelocityDirection = horizontalForce < 0 ? -1 : 1
    
        // Set the angular velocity. Adjust the multiplier as needed to control the rotation speed
        this.setAngularVelocity(angularVelocityDirection * Math.abs(angularForce))

        // Emit the BALL_PUSH_EVENT event with relevant data
        this.emit(this.BALL_PUSH_EVENT, force, angularForce, angle)

    }

    public stableBall(): void{
        this.setVelocity(0, 0)
        //this.setImmovable(true);
        this.arcadeBody.setAllowGravity(false)
        this.setAngularVelocity(0)
    }

    public getWorldPosition() : Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.worldX, this.worldY)
    }

    public internalHoopOverlapCallback(ball: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, internalHoop: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody) {
        // You can emit an event from the ball or execute any logic here
        

        if (ball instanceof Ball && internalHoop instanceof InternalHoopArcadeImage) {
            // Now you can use 'ball' to emit events
            
            //var touching = !ball.arcadeBody.touching.none;
            //var touching = ball.arcadeBody.overlapR !==0 ;

            //console.log("touching", touching, "touching noun", !ball.arcadeBody.touching.none, "embedded", ball.arcadeBody.embedded, "binding", ball.isBinded(), "overlaping", ball.arcadeBody.overlapR, ball.arcadeBody.overlapR !==0 );
            //console.log(touching, ball.isBinded(), ball.wasBinded());
            
            const basketballHoop = internalHoop.getBasketballHoop()
            if (!ball.getIsBinded() && !ball.getWasBinded()){
                
                //ball.bindBall(basketballHoop);
                ball.emit(ball.INTERNAL_HOOP_OVERLAP_START_EVENT, basketballHoop)
                
            }

        }
    }

    public wallCollisionCallback(ball: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, wall: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody) {
        // You can emit an event from the ball or execute any logic here
        if (ball instanceof Ball && wall instanceof BoundaryImage) {
            ball.emit(ball.WALL_COLLIDE_EVENT, wall)

        }
    }
    
    public hoopCollisionCallback(ball: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, hoop: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody) {
        // You can emit an event from the ball or execute any logic here

        if (!(ball instanceof Ball)) {
            return 
        }

    
        const wasBlocked = ball.getWasBlocked()
        

        if (!wasBlocked){
            ball.setWasBlocked(true)
            if (hoop instanceof RingHoopArcadeImage) {
                ball.emit(ball.RING_HOOP_COLLIDE_EVENT, hoop)
            }
            else if (hoop instanceof NetArcadeImage) {
                ball.emit(ball.NET_COLLIDE_EVENT, hoop)
            }
        }
        
    }

    public collectibleOverlapCallback(ball: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody, collectible: Phaser.Tilemaps.Tile | Phaser.Types.Physics.Arcade.GameObjectWithBody) {
        // You can emit an event from the ball or execute any logic here
        if (ball instanceof Ball) {
            ball.emit(ball.COLLECTIBLE_OVERLAP_EVENT, collectible)
        }
    }

    public setWasBlocked(blocked : boolean) : void{
        this.wasBlocked = blocked
    }

    public getWasBlocked() : boolean{
        return this.wasBlocked
    }

    

        // Collision callback to adjust ball's bounce based on the object it collides with
    private adjustBounceOnCollidingObject(collidedObject : GameObjects.GameObject) {
        // Example: Adjust the ball's bounce property dynamically
        // This can be more complex based on the object properties

        
        if (collidedObject instanceof BoundaryImage) { // Assuming Platform is a class you have for platforms
            //this.setBounce(1);
            //console.log("collided with wall");
        } 
        else if (collidedObject instanceof RingHoopArcadeImage) {
            //this.setBounce(0.8);
            
            this.arcadeBody.velocity.x *= 0.55
            this.arcadeBody.velocity.y *= 0.55
            //console.log("collided with ring hoop");
        }
        else if (collidedObject instanceof NetArcadeImage) {
            //this.setBounce(0.3);
            this.arcadeBody.velocity.x *= 0.6
            this.arcadeBody.velocity.y *= 0.6
            //console.log("collided with net hoop");
        }

    }
}

export default Ball