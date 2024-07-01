import Ball from "../entities/Ball";
import BasketballHoop from "../entities/hoops/BasketballHoop";
import ITrajectory from "../entities/trajectories/ITrajectory";
import DunkShotGameScene from "../scenes/DunkShotGameScene";


class DunkShotGameInputHandler {
    private scene: DunkShotGameScene;
    private isDragging: boolean = false;
    private dragStartPoint: Phaser.Math.Vector2;
    private currentHoop: BasketballHoop;
    private ball: Ball;
    private trajectory : ITrajectory;

    private canShoot: boolean = false;

    private readonly MIN_REQUIRED_SCALED_DISTANCE: number = 0.4;

    private readonly SCALING_FACTOR: number = 0.008;

    private readonly PUSH_BALL_FORCE: number = 1100;
    
    
    constructor(scene: DunkShotGameScene, ball: Ball, trajectory : ITrajectory) {
        this.scene = scene;
        this.ball = ball;
        this.trajectory = trajectory;

        this.dragStartPoint = new Phaser.Math.Vector2();

        // Mouse down event
        this.scene.input.on('pointerdown', this.onPointerDown.bind(this));

        // Mouse move event
        this.scene.input.on('pointermove', this.onPointerMove.bind(this));

        // Mouse up event
        this.scene.input.on('pointerup', this.onPointerUp.bind(this));

        // Overlap events
        
        this.ball.on(this.ball.INTERNAL_HOOP_OVERLAP_START_EVENT, this.onHoopEnter.bind(this));
        this.ball.on(this.ball.INTERNAL_HOOP_OVERLAP_END_EVENT, this.onHoopExit.bind(this));
    }

    private onPointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.canShoot) return;

        this.isDragging = true;
        this.dragStartPoint.set(pointer.x, pointer.y);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.isDragging || !this.canShoot) return;

        // Scale logic
        let dragDistance = this.calculateScaledDistance();

        // Net scale logic
        this.currentHoop.setNetScale(dragDistance + 1);

        // Rotation logic
        let angle = Phaser.Math.Angle.Between(this.dragStartPoint.x, this.dragStartPoint.y, pointer.x, pointer.y);
        this.currentHoop.setRotation(angle  - Math.PI / 2);

        // Draw trajectory

        if (this.MIN_REQUIRED_SCALED_DISTANCE > dragDistance) {
            this.trajectory.clear();
            return;
        }

        const ballWorldPosition = this.ball.getWorldPosition();
        this.trajectory.draw(ballWorldPosition, this.calculateForceFromScaleDistance(dragDistance), angle + Math.PI);
    }

    private onPointerUp(pointer: Phaser.Input.Pointer) {
        if (!this.isDragging || !this.canShoot) return;

        
        let distance = this.calculateScaledDistance();
        

        this.isDragging = false;
        this.trajectory.clear();

        if (this.MIN_REQUIRED_SCALED_DISTANCE > distance) {
            return;
        }

        // Add ball force
        let force = this.calculateForceFromScaleDistance(distance);
        let angle = Phaser.Math.Angle.Between(this.dragStartPoint.x, this.dragStartPoint.y, this.scene.input.activePointer.x, this.scene.input.activePointer.y) + Math.PI;
        
        

        // Tween for net scale
        this.scene.tweens.add({
            targets: this.currentHoop, 
            value: { from: this.currentHoop.getCurrentNetScale(), to: 1 }, // Dynamically scale from current to 1
            duration: 100, // Duration of the tween in milliseconds
            ease: 'Sine.easeInOut', // Easing function
            onComplete: () => {
                // Once the tween is complete, push the ball
                
                const internalHoopContainer = this.currentHoop.getInternalHoopContainer();
                internalHoopContainer.remove(this.ball);

                this.ball.unbindBall();
        
                // Reset Position of ball
                let worldPosition = this.currentHoop.getInternalHoopWorldPosition();
                this.ball.x = worldPosition.x;
                this.ball.y = worldPosition.y;
                
                this.ball.pushBall(force, force * 2, angle);
            },
            onUpdate: (tween) => {
                const value = tween.getValue();
                this.currentHoop.setNetScale(value);
            }
        });
    }

    public setCurrentHoop(hoop: BasketballHoop): void {
        this.currentHoop = hoop;
    }

    private onHoopEnter(basketballHoop : BasketballHoop): void {
        
        this.currentHoop = basketballHoop;
        this.ball.stableBall();

        console.log("Hoop entered" , this.ball.x, this.ball.y, this.ball.getIsBinded());
        // Calculate world position of the hoop
        let worldPosition = basketballHoop.getInternalHoopWorldPosition();
        
        const internalHoopContainer = basketballHoop.getInternalHoopContainer();
        basketballHoop.disableCollision();

        // Tween for moving ball to the hoop's world position
        this.scene.tweens.add({
            targets: this.ball,
            x: worldPosition.x,
            y: worldPosition.y,
            duration: 100, // Adjust duration as needed
            ease: 'Power2.easeInOut',
            onComplete: () => {
                // Once the ball reaches the hoop, add it to the internal hoop container
                console.log("Ball reached hoop");

                internalHoopContainer.add(this.ball);
                this.ball.x = 0;
                this.ball.y = 0;

                this.ball.bindBall(basketballHoop);
                
                
                this.canShoot = true;
            }
        });

        //Tween for reducing ball's angular velocity to 0
        this.scene.tweens.add({
            targets: this.ball.body,
            angularVelocity: 0,
            duration: 100, // Adjust duration as needed
            ease: 'Sine.easeOut',
        });

        //Tween for setting hoop's rotation to 0
        this.scene.tweens.add({
            targets: basketballHoop,
            values: { from : basketballHoop.getRotation(), to: 0},
            duration: 100, // Adjust duration as needed
            ease: 'Quad.easeOut',

            onUpdate: (tween) => {
                const value = tween.getValue();
                basketballHoop.setRotation(value);
            }
        });

        const originalScale = basketballHoop.getCurrentNetScale();
        const maxScale = originalScale * 1.5; // Example scale factor

        this.scene.tweens.add({
            targets: basketballHoop,
            values: { from: originalScale, to: maxScale },
            yoyo: true, // Goes back to original scale
            ease: 'Sine.easeInOut', // This can be adjusted for different effects
            duration: 100, // Duration of one cycle
            onUpdate: (tween) => {
                const value = tween.getValue();
                basketballHoop.setNetScale(value);
            }
        });
        

    }

    public onHoopExit(basketballHoop : BasketballHoop): void {
        console.log("Hoop exited");

        this.canShoot = false;

        this.currentHoop.enableCollision(this.ball, this.ball.hoopCollisionCallback);
        this.currentHoop.enableOverlap(this.ball, this.ball.internalHoopOverlapCallback);
    }

    private calculateScaledDistance(): number {
        const distance = Phaser.Math.Distance.Between(this.dragStartPoint.x, this.dragStartPoint.y, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
        const scaledDistance = Phaser.Math.Clamp(distance * this.SCALING_FACTOR, 0, 1);
        return scaledDistance;
    }

    private calculateForceFromScaleDistance(scaledDistance: number): number {
        let force = Math.max(scaledDistance, 0) * this.PUSH_BALL_FORCE;
        return force;
    }
}

export default DunkShotGameInputHandler;