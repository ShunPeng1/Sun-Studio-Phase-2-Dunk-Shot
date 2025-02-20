import { Scene } from "phaser"
import AssetManager from "../../managers/AssetManager"
import RingHoopPhysicGroupContainer from "../physics/RingHoopPhysicGroupContainer"
import InternalHoopPhysicGroupContainer from "../physics/InternalHoopPhysicGroupContainer"
import NetLinePhysicGroupContainer from "../physics/NetLinePhysicGroupContainer"
import ObstacleBoundaryImage from "../boundaries/ObstacleBoundaryImage"

class BasketballHoop extends Phaser.GameObjects.GameObject implements Phaser.GameObjects.Components.Transform, Phaser.GameObjects.Components.Texture {
    
    public hasTransformComponent: boolean // Tileset variable initial set
    public x: number // Tileset variable initial set
    public y: number // Tileset variable initial set
    public z: number // Tileset variable initial set
    public w: number // Tileset variable initial set
    public scale: number // Tileset variable initial set
    public scaleX: number // Tileset variable initial set
    public scaleY: number // Tileset variable initial set
    public angle: number // Tileset variable initial set
    public rotation: number // Tileset variable initial set
    public texture: Phaser.Textures.Texture | Phaser.Textures.CanvasTexture // Tileset variable initial set
    public frame: Phaser.Textures.Frame // Tileset variable initial set
    
    private isInitialized = false

    // Components of the basketball hoop
    private innerRing : Phaser.GameObjects.Image
    private outerRing : Phaser.GameObjects.Image
    private net : Phaser.GameObjects.Image
    
    private currentRingScale = 1
    private currentNetScale = 1
    
    private readonly RING_RADIUS: number = 83 // Property to store the radius of the circle collider
    
    // Container to hold the hoop components
    private hoopContainer: Phaser.GameObjects.Container
    private internalHoopContainer: Phaser.GameObjects.Container
    private obstacles: ObstacleBoundaryImage[] = []

    // Collider properties
    
    private readonly NET_OFFSET_Y = 10 // Vertical offset between components

    private readonly COLLIDER_OFFSET_X: number = 6
    private readonly COLLIDER_OFFSET_Y: number = 5
    public readonly COLLIDER_INTERNAL_OFFSET_Y = 40
    public readonly INTERNAL_CONTAINER_OFFSET_Y = 36
    private readonly COLLIDER_INTERNAL_RADIUS = 17

    private ringPhysicGroupContainer: RingHoopPhysicGroupContainer
    private internalHoopPhysicGroupContainer: InternalHoopPhysicGroupContainer
    private linePhysicGroupContainer: NetLinePhysicGroupContainer
    

    private lineCollider: Phaser.Physics.Arcade.Collider | null
    private ringCollider: Phaser.Physics.Arcade.Collider | null
    private internalHoopOverlap: Phaser.Physics.Arcade.Collider | null

    constructor(scene : Scene, x : number, y : number) {
        
        super(scene, 'BasketballHoop')   

        this.hoopContainer = scene.add.container(x, y)


        this.initImageComponents(scene, x, y) // Initialize the image components

        this.initCircleCollider(scene, x, y) // Initialize the circle collider
        
        this.initInternalHoopComponents(scene, x, y) // Initialize the internal hoop components
        
        
        this.isInitialized = true

        this.updateComponentPosition()
    
    }
    copyPosition(_source: Phaser.Types.Math.Vector2Like | Phaser.Types.Math.Vector3Like | Phaser.Types.Math.Vector4Like): this {
        throw new Error("Method not implemented.")
    }
    setRandomPosition(_x?: number | undefined, _y?: number | undefined, _width?: number | undefined, _height?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    setAngle(_degrees?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    setX(_value?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    setY(_value?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    setZ(_value?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    setW(_value?: number | undefined): this {
        throw new Error("Method not implemented.")
    }
    getLocalTransformMatrix(_tempMatrix?: Phaser.GameObjects.Components.TransformMatrix | undefined): Phaser.GameObjects.Components.TransformMatrix {
        throw new Error("Method not implemented.")
    }
    getLocalPoint(_x: number, _y: number, _point?: Phaser.Math.Vector2 | undefined, _camera?: Phaser.Cameras.Scene2D.Camera | undefined): Phaser.Math.Vector2 {
        throw new Error("Method not implemented.")
    }
    getParentRotation(): number {
        throw new Error("Method not implemented.")
    }
    setFrame(_frame: string | number | Phaser.Textures.Frame, _updateSize?: boolean | undefined, _updateOrigin?: boolean | undefined): this {
        throw new Error("Method not implemented.")
    }

    private initImageComponents(scene: Scene, x: number, y: number): void {
        // Load images
        this.innerRing = scene.add.image(x, y, AssetManager.INNER_RING_BASKET_KEY)
        this.innerRing.setDepth(-1)
        this.innerRing.setTint(0xea4214)
        

        this.outerRing = scene.add.image(x, y, AssetManager.OUTER_RING_BASKET_KEY)
        this.outerRing.setDepth(2)
        this.outerRing.setTint(0xea4214)

        this.net = scene.add.image(x, y + this.NET_OFFSET_Y, AssetManager.NET_BASKET_KEY)
        this.net.setDepth(1)
        this.net.setOrigin(0.5, 0)
    }

    private initCircleCollider(scene: Scene, _x: number, _y: number): void {

        this.ringPhysicGroupContainer = new RingHoopPhysicGroupContainer(scene, 0, 0, this.RING_RADIUS, 0, 10, this)
        this.ringPhysicGroupContainer.setOffset(this.COLLIDER_OFFSET_X, this.COLLIDER_OFFSET_Y)
        this.ringPhysicGroupContainer.setImmovable(true)
        this.ringPhysicGroupContainer.setAllowGravity(false)
        this.ringPhysicGroupContainer.setBounce(0.5)

        this.hoopContainer.add(this.ringPhysicGroupContainer)


        // Create the line collider
        this.linePhysicGroupContainer = new NetLinePhysicGroupContainer(this.scene, 0, 0, -this.RING_RADIUS + 5, this.RING_RADIUS - 5, x => -1/83 * x**2 + 0 * x + this.RING_RADIUS, 12, 20, this)
        
        this.linePhysicGroupContainer.setOffset(this.COLLIDER_OFFSET_X, this.COLLIDER_OFFSET_Y)
        this.linePhysicGroupContainer.setImmovable(true)
        this.linePhysicGroupContainer.setAllowGravity(false)
        this.linePhysicGroupContainer.setBounce(0.5)

        

        this.hoopContainer.add(this.linePhysicGroupContainer)
        
    }

    private initInternalHoopComponents(scene: Scene, _x: number, _y: number): void {
        
        // Create the internal hoop components
        this.internalHoopContainer = scene.add.container(0, this.INTERNAL_CONTAINER_OFFSET_Y)
        this.hoopContainer.add(this.internalHoopContainer)
        

        
        // Create the internal collider
        this.internalHoopPhysicGroupContainer = new InternalHoopPhysicGroupContainer(scene, 0, this.COLLIDER_INTERNAL_OFFSET_Y, this.COLLIDER_INTERNAL_RADIUS, this)
        this.internalHoopPhysicGroupContainer.setOffset(-this.COLLIDER_INTERNAL_RADIUS*0.1, 0)
        this.internalHoopPhysicGroupContainer.setImmovable(true)
        this.internalHoopPhysicGroupContainer.setAllowGravity(false)
        this.internalHoopPhysicGroupContainer.setEnable(true) // Make the collider a trigger
    
        this.hoopContainer.add(this.internalHoopPhysicGroupContainer)
    }


    public setRingTint(color: number) : void {
        this.innerRing.setTint(color)
        this.outerRing.setTint(color)        
    }


    public setNetScale(scale: number) : void {
        if (scale < 1) {
            scale = 1
        }
        if (scale > 3) {
            scale = 3
        }

        this.currentNetScale = scale

        this.updateComponentPosition()
    }

    
    public setPosition(x: number, y: number) : this {

        if (!this.isInitialized) {
            return this
        }

        this.hoopContainer.setPosition(x, y)
        this.innerRing.setPosition(x, y)
        this.outerRing.setPosition(x, y)
        this.net.setPosition(x, y + this.NET_OFFSET_Y) // Adjust the Y offset as needed

        //this.lineCollider.setPosition(x, y,0,0);
        this.internalHoopContainer.setPosition(x, y)
        

        this.updateComponentPosition()

        return this
    }

    // Method to set the scale of the basketball hoop components
    public setScale(scaleX: number, scaledY? : number) : this {
        

        this.currentRingScale = scaleX
        this.hoopContainer.setScale(scaleX, scaledY)
        this.innerRing.setScale(scaleX)
        this.outerRing.setScale(scaleX)
        
        this.internalHoopContainer.setScale(1/scaleX)
        

        this.updateComponentPosition()

        return this
    }
    
    public setRotation(angle: number) : this {
       
        this.hoopContainer.setRotation(angle)
        this.innerRing.setRotation(angle)
        this.outerRing.setRotation(angle)
        this.net.setRotation(angle)

        this.internalHoopContainer.setRotation(angle)

        this.updateComponentPosition()

        return this
    }

    public setTexture(_texture: string) : this {
        // Ignore
        return this
    }

    public setFlip(_x: boolean, _y: boolean) : this {
        // Ignore
        return this
    }

    public setHoopTextureToGold() : void {
        this.innerRing.setTint(0xfbc230)
        this.outerRing.setTint(0xfbc230)
        this.net.setTexture(AssetManager.BASKETS_211_KEY)
    }

    public getPosition() : Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.hoopContainer.x, this.hoopContainer.y)
    }

    public getRotation() : number {
        return this.innerRing.rotation
    }

    public getScale() : number {
        return this.currentRingScale
    }

    public getInternalHoopWorldPosition() : Phaser.Math.Vector2 {
        // Create a new Matrix to hold the world transformation
        const matrix = new Phaser.GameObjects.Components.TransformMatrix()
        // Create a point that represents the local position of the internalHoopContainer
        const localPoint = new Phaser.Geom.Point(0, 0)
        // Create a point to hold the transformed world position
        const worldPoint = new Phaser.Geom.Point()

        // Get the world transformation matrix for the internalHoopContainer
        this.internalHoopContainer.getWorldTransformMatrix(matrix)
        // Apply the matrix transformation to the local point to get the world position
        matrix.transformPoint(localPoint.x, localPoint.y, worldPoint)


        return new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)
    }

    public getWorldTransformMatrix() : Phaser.GameObjects.Components.TransformMatrix {
        const matrix = new Phaser.GameObjects.Components.TransformMatrix()
        this.internalHoopContainer.getWorldTransformMatrix(matrix)
        return matrix
    }

    public getCurrentNetScale(): number {
        return this.currentNetScale
    }

    public getInternalHoopContainer(): Phaser.GameObjects.Container {
        return this.internalHoopContainer
    }

    public enableCollision(ball : Phaser.Types.Physics.Arcade.ArcadeColliderType, callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback) : void {

        this.ringCollider = this.scene.physics.add.collider(ball, this.ringPhysicGroupContainer.getColliders(), callback, undefined, this)

        // Enable collision between the ball and the line collider
        this.lineCollider = this.scene.physics.add.collider(ball, this.linePhysicGroupContainer.getColliders(), callback, undefined, this)
    }

    public disableCollision() : void {
        if (this.ringCollider) {
            this.scene.physics.world.removeCollider(this.ringCollider)
            this.ringCollider = null
        }

        if (this.lineCollider) {
            this.scene.physics.world.removeCollider(this.lineCollider)
            this.lineCollider = null
        }

    }

    public enableOverlap(ball : Phaser.Types.Physics.Arcade.ArcadeColliderType, callback?: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback) : void {
        if (this.internalHoopOverlap)
        {
            return
        }

        const internalHoopImage = this.internalHoopPhysicGroupContainer.getColliders()
        
        this.internalHoopOverlap = this.scene.physics.add.overlap(ball, internalHoopImage, callback, undefined, this)
    }

    public disableOverlap() : void {
        if (this.internalHoopOverlap)
        {    
            this.scene.physics.world.removeCollider(this.internalHoopOverlap)  
            this.internalHoopOverlap = null
        }
        
    }

    public addObstacle(obstacle: ObstacleBoundaryImage) : void {
        

        this.obstacles.push(obstacle)
    }



    private updateComponentPosition() : void {
        
        // Net scale is relative to the ring scale
        this.net.setScale(this.currentRingScale, this.currentRingScale * this.currentNetScale)
        this.net.y = this.innerRing.y + this.NET_OFFSET_Y * this.currentRingScale - Math.abs(Math.sin(this.innerRing.rotation/2)) * this.currentRingScale * 20
        this.net.x = this.innerRing.x - Math.sin(this.innerRing.rotation) * this.currentRingScale * 10

        this.linePhysicGroupContainer.setScale(1, this.currentNetScale)

        this.internalHoopContainer.setPosition(0, this.INTERNAL_CONTAINER_OFFSET_Y * this.currentNetScale)
    }

    public destroy(): void {
        
        this.innerRing.destroy()
        this.outerRing.destroy()
        this.net.destroy()

        this.obstacles.forEach(obstacle => {
            obstacle.destroy()
        })
        
        this.internalHoopContainer.destroy()
        this.hoopContainer.destroy()


        this.disableCollision()
        this.disableOverlap()

        super.destroy()
    }

}



export default BasketballHoop