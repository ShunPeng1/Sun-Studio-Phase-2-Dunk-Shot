import ImageTrajectory from "./ImageTrajectory"
// Assuming Vector2Utils is in the same directory
import Phaser from "phaser"
import AssetManager from "../../managers/AssetManager"

class BoundaryImageTrajectory extends ImageTrajectory {
    public draw(startPosition: Phaser.Math.Vector2, force: number, angle: number): void {
        this.clear()

        const forceVector = new Phaser.Math.Vector2(force * Math.cos(angle), force * Math.sin(angle))
        const velocity = new Phaser.Math.Vector2(forceVector.x, forceVector.y)
        const currentPosition = new Phaser.Math.Vector2(startPosition.x, startPosition.y)
        const gravity = this.scene.physics.world.gravity.clone()

        
        const dvx = velocity.x
        const dvy = velocity.y
        for (let i = 0; i < this.maxIteration; i += this.skipping) {
            const time = i / this.scene.physics.world.fps
            let dx = startPosition.x + dvx * time
            const dy = startPosition.y + dvy * time + 0.5 * gravity.y * time * time
            
            

            currentPosition.set(dx, dy)
            const distanceTraveled = Phaser.Math.Distance.Between(startPosition.x, startPosition.y, currentPosition.x, currentPosition.y)
    
            // End the loop if the distance traveled exceeds the maximum distance
            if (distanceTraveled > this.maxDistance) {
                break
            }
        
            
            if (dx >= AssetManager.WORLD_WIDTH) {
                // Adjust nextPosition to simulate the bounce
                dx = AssetManager.WORLD_WIDTH - (dx - AssetManager.WORLD_WIDTH) 
            }
            else if (dx <= 0) {
                // Adjust nextPosition to simulate the bounce
                dx = -dx 
            }

            

    
            if (i % this.skipping === 0) {
                // Place an image at the current position
                const image = this.scene.add.image(dx, dy, this.textureKey)
                image.setTint(this.color)
                image.setScale(this.scale)
                image.setOrigin(0.5, 0.5)
                
                this.images.push(image)
            }
        
        }
    }
}

export default BoundaryImageTrajectory