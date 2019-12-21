import LivingCtr from "./LivingCtr";
import WarriorMod from "./WarriorMod";
import { ActState, SkillType, SkillActType, SkillAtkType } from "../common/G";
import { SkillBase } from "../manager/SkillMgr";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("role/WarriorCtr")
export default class WarriorCtr extends LivingCtr {
    model:WarriorMod = new WarriorMod(this);

    idle(dir: number = null) {
        if(this.model.isDead){
            return;
        }
        super.idle(dir);
    }

    attack(dir?: number){
        if (this.model.isDead) {
            return;
        }
        this.runAction(dir, ActState.ATK);
    }

    magic(dir?: number){
        if (this.model.isDead) {
            return;
        }
        this.runAction(dir, ActState.MGC);
    }

    move(dir: number) {
        if (this.model.isDead) {
            return;
        }
        this.runAction(dir, ActState.RUN);
    }

    dead() {
        if (this.model.isDead) {
            return;
        }
        this.runAction(2, ActState.DIE);
    }

    doSkill(skill:SkillBase, dir?: number){
        if (this.model.isDead) {
            return;
        }
        
        if(skill.atkType == SkillAtkType.Physics){
            this.attack(dir);
        } else{
            this.magic(dir);   
        }
        // 下面播放 技能在 自身身上的特效
	}
}