import { GameObjects } from "phaser"
import Ball from "./Ball"
import FireTrail from "../particles/FireTrail"
import BasketballHoop from "../hoops/BasketballHoop"
import SmokeTrail from "../particles/SmokeTrail"
import BallInteraction from "./BallInteraction"

class BallParticle extends GameObjects.GameObject {
    private fireTrail: FireTrail
    private smokeTrail: SmokeTrail


    constructor(scene: Phaser.Scene, type: string, ball: Ball, ballInteraction: BallInteraction, follower : GameObjects.Graphics){
        
        super(scene, type)
        
        //this.scene.add.existing(this);

        ballInteraction.on(BallInteraction.ENTER_NEXT_HOOP_EVENT, this.countPerfect.bind(this))

        ball.on(ball.RING_HOOP_COLLIDE_EVENT, this.setBounceRing.bind(this))

        this.fireTrail = new FireTrail(scene, 0, 0, follower)
        this.smokeTrail = new SmokeTrail(scene, 0, 0, follower)

        this.scene.add.existing(this.fireTrail)
        this.scene.add.existing(this.smokeTrail)

    
        
    }

    

    private countPerfect(hoop : BasketballHoop, lastHoop : BasketballHoop, perfectCount : number) : void {
        

        if (perfectCount == 2) {
            this.smokeTrail.start()
            
        }
        else if (perfectCount > 2) {
            this.fireTrail.start()
            this.smokeTrail.stop()
        }
        

    }

    private setBounceRing() : void {
        this.fireTrail.stop()
        this.smokeTrail.stop()

    }
}

export default BallParticle