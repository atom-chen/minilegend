import MonsterMod from "./MonsterMod";
import WarriorCtr from "./WarriorCtr";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("role/MonsterCtr")
export default class MonsterCtr extends WarriorCtr {
    model: MonsterMod = new MonsterMod(this);

    start() {
        super.start();
        this.init();
    }

    init() {
        this.model.init();
    }


    testCtr() {
        console.log("test monster control");
    }
}