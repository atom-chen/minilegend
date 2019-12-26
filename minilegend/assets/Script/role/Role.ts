/**
 * 地图上 战斗角色 所在的实际节点 
 *      控制并计算 角色在地图上位置
 */
import { ActState, AttrIds, LivingType } from "../common/G";
import MapMgr from "../manager/MapMgr";
import Stage from "../map/Stage";
import WarriorCtr from "./WarriorCtr";
import WeaponCtr from "./weaponCtr";
import ObjectMgr from "../manager/ObjectMgr";
import { getDir, getAngle } from "../common/gFunc";
import WarriorMod from "./WarriorMod";
import PlayerMgr from "../manager/PlayerMgr";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("role/Role")
export default class Role extends cc.Component {
    private _x: number = -1;
    public get x(): number {
        return this._x;
    }
    public set x(v: number) {
        // 未初始化状态 可以直接设置 地图实际位置
        if (this._x == -1) {
            this.node.x = MapMgr.girdX2PixX(v);
        }
        this._x = v;
        this.model.x = v;
    }

    private _y: number = -1;
    public get y(): number {
        return this._y;
    }
    public set y(v: number) {
        // 未初始化状态 可以直接设置 地图实际位置
        if (this._y == -1) {
            this.node.y = MapMgr.girdY2PixY(v);
        }
        this._y = v;
        this.model.y = v;
    }

    public get pixx(): number {
        return this.node.x;
    }
    public set pixx(v: number) {
        this.node.x = v;
        this._x = MapMgr.pixX2GirdX(v);
    }

    public get pixy(): number {
        return this.node.y;
    }
    public set pixy(v: number) {
        this.node.y = v;
        this._y = MapMgr.pixY2GirdY(v);
    }

    weapon: WeaponCtr = null;
    warrior: WarriorCtr = null;
    model: WarriorMod = null;

    stage: Stage = null;

    unDoAnyThingTimer: number = 0;
    aiTimer: number = 0;
    aiDo: number = 0;
    param: any = null;
    // 目标
    target: Role = null;

    onLoad() {
        this.stage = this.node.parent.parent.getComponent(Stage);
        this.warrior = this.node.getChildByName("rolectr").getComponent(WarriorCtr);
        this.model = this.warrior.model;
        let node = this.node.getChildByName("weapon");
        this.weapon = node.getComponent(WeaponCtr);
        this.weapon.resId = 0;
    }

    start() {
        // this.stage.effectLayer
    }

    getWarrior(): WarriorCtr {
        return this.warrior;
    }

    enterStage(mapid: number, stageid: number) {
        this.model.mapid = mapid;
        if (this.model.stageid == stageid) {
            return;
        }

        let mapdata = MapMgr.instance.getMapData(this.model.mapid);
        let stagedata = mapdata.stageList[stageid];
        if (stagedata) {
            this.model.stageid = stageid;
            let pos = MapMgr.girdPos2pixPos(cc.v2(stagedata.startPos.x, stagedata.startPos.y));
            this.node.setPosition(pos);
        }
    }

    findTarget(targettype: LivingType): Role {
        let list: Role[] = [];
        let objlist = ObjectMgr.instance.objectList;
        // 找到最近的 目标
        for (const _ in objlist) {
            if (objlist.hasOwnProperty(_)) {
                const role = objlist[_];
                if (role.model.onlyid == this.model.onlyid) {
                    continue;
                }
                if (role.warrior.model.isDead == false && role.warrior.model.livingType == targettype) {
                    let len = cc.v2(this.x, this.y).sub(cc.v2(role.x, role.y)).mag();
                    role.param = len;
                    list.push(role);
                }
            }
        }

        if (list.length == 0) {
            return null;
        } else if (list.length == 1) {
            return list[0];
        }

        list.sort((a, b) => {
            return a.param - b.param;
        });

        return list[0];
    }

    aiMoveToTarget() {
        if (this.warrior.state != ActState.IDLE) {
            return;
        }
        this.warrior.move(getDir(this.x, this.y, this.target.x, this.target.y));
        // setTimeout(() => {
        //     this.warrior.idle();
        // }, 300);
    }

    checkPos(dt) {
        if (this.warrior.state != ActState.RUN) {
            return;
        }

        let len = this.model.attr[AttrIds.Speed] * dt;
        let xie = 0.75;
        let x = 0, y = 0;
        if (this.warrior.dir == 1) {
            x = y = -xie;
        } else if (this.warrior.dir == 2) {
            x = 0; y = -1;
        } else if (this.warrior.dir == 3) {
            x = xie; y = -xie;
        } else if (this.warrior.dir == 4) {
            x = -1; y = 0;
        } else if (this.warrior.dir == 6) {
            x = 1; y = 0;
        } else if (this.warrior.dir == 7) {
            x = -xie; y = xie;
        } else if (this.warrior.dir == 8) {
            x = 0; y = 1;
        } else if (this.warrior.dir == 9) {
            x = xie; y = xie;
        }
        let ppos = this.node.position;
        let apos = cc.v2(x * len, y * len);
        let npos = ppos.add(apos);
        let grid = 0;

        while (true) {
            let stagedata = MapMgr.instance.getStageData(this.model.mapid, this.model.stageid);
            if (!stagedata) {
                break;
            }
            let tryxy = (tx: number = 0, ty: number = 0) => {
                apos = cc.v2(tx, ty);
                npos = ppos.add(apos);
                let tnc_pos = MapMgr.pixPos2GirdPos(npos);

                grid = stagedata.mapInfo[tnc_pos.y][tnc_pos.x];
                if (grid > 0) {
                    return true;
                }
                return false;
            }
            // 先判断 下一点 是否超界
            let nc_pos = MapMgr.pixPos2GirdPos(npos);
            let y_ckecn = false, x_check = false;
            if (nc_pos.y < 0 || nc_pos.y >= stagedata.mapInfo.length) {
                nc_pos.y = stagedata.mapInfo.length - 1;
                y_ckecn = true;
            }
            if ((nc_pos.x < 0 || nc_pos.x >= stagedata.mapInfo[nc_pos.y].length)) {
                x_check = true;
            }
            // y轴超界 判断x轴
            if (y_ckecn && !x_check && tryxy(x * len, 0)) {
                break;
            }
            // x轴超界 判断y轴
            if (x_check && !y_ckecn && tryxy(0, y * len)) {
                break;
            }
            // xy 同时超界 直接跳出
            if (x_check && y_ckecn) {
                npos = ppos;
                break;
            }
            // 不超界的情况下，判断是否可走
            grid = stagedata.mapInfo[nc_pos.y][nc_pos.x];
            if (grid > 0) {
                break;
            }
            if (tryxy(x * len, 0)) {
                break;
            }
            if (tryxy(0, y * len)) {
                break;
            }
            break;
        }

        if (npos.x < 0) {
            npos.x = 0;
        } else if (npos.x > this.stage.node.width) {
            npos.x = this.stage.node.width;
        } else if (npos.y < 0) {
            npos.y = 0;
        } else if (npos.y > this.stage.node.height) {
            npos.y = this.stage.node.height;
        }

        if (grid == 0) {
            // this.warrior.idle();
            return;
        } else if (grid == 1) {
            this.node.opacity = 255;
        } else if (grid == 2) {
            this.node.opacity = 100;
        }

        this.node.setPosition(npos);
        this.node.zIndex = cc.winSize.height - npos.y;

        let gridpos = MapMgr.pixPos2GirdPos(npos);
        this.x = gridpos.x;
        this.y = gridpos.y;
    }

    doAiAction() {
        if (this.target == null) {
            let targettype = LivingType.MONSTER;
            if (this.model.livingType == LivingType.MONSTER) {
                targettype = LivingType.PLAYER;
            }
            let target = this.findTarget(targettype);
            this.target = target;
        }

        if (this.target == null) {
            return;
        }

        let target_pos = cc.v2(this.target.x, this.target.y);
        let self_pos = cc.v2(this.x, this.y);
        let skill = this.model.aiSkill(target_pos);
        if (skill == null) {
            let len = self_pos.sub(target_pos).mag();
            if (len > 1 && this.model.livingType == LivingType.MONSTER) {
                this.aiMoveToTarget();
            }
            return;
        }
        let atknum = skill.getatk(this.model.attr);
        this.warrior.doSkill(skill, getDir(this.x, this.y, this.target.x, this.target.y));
        skill.do();
        // 如果技能是 带飞行的 须等技能碰撞
        if (skill.flyEffect == 0) {
            let num = this.target.model.beHit(atknum, skill);
            // this.target.warrior.beHit(skill);
            let epos = MapMgr.girdPos2pixPos(cc.v2(this.target.x, this.target.y)).add(skill.enemyEffOffset);
            this.stage.playEffect(skill.enemyEffect, epos.x, epos.y);
            if (num > 0) {
                this.stage.effectLayer.showHitNum(num, this.target.node.position, null, PlayerMgr.instance.isMainRole(this.model.onlyid));
            }
            if (this.target && this.target.model.isDead) {
                this.target = null;
            }
        } else {
            // 带飞行特效 要创建碰撞体
            let angle = getAngle(this.pixx, this.pixy, this.target.pixx, this.target.pixy);
            this.stage.effectLayer.addFlyEffect(skill.flyEffect, this.pixx, this.pixy, skill.flySpeed, angle, skill.skillId, this.model.onlyid);
        }
    }

    AiAction(dt) {
        if (this.model.isDead) {
            return;
        }

        // 如果是玩家角色超过2秒不动，AI操作
        if (this.model.livingType == LivingType.PLAYER) {
            this.unDoAnyThingTimer += dt;
            if (this.unDoAnyThingTimer < 2) {
                return;
            }
        }

        this.aiTimer += dt;
        let dotime = Math.floor(this.aiTimer / 1);
        if (dotime != this.aiDo) {
            if (this.aiTimer > 10000) {
                this.aiTimer = 0;
            }
            this.aiDo = dotime;
            this.doAiAction();
        }
    }

    update(dt) {
        this.checkPos(dt);
        this.AiAction(dt);
    }

    relive() {
        this.model.relive();
        this.warrior.idle();
    }

    clean() {
        ObjectMgr.instance.delObject(this);
        if(this.model.isPlayer()){
            PlayerMgr.instance.delPlayer(this.model.onlyid);
        }
        this.stage.effectLayer.delRoleEx(this.model.onlyid);
        this.destroy();
    }
}