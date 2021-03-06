import Equip, { EquipData } from "../app/item/equip/Equip";
import attributeMgr from "./AttributeMgr";
import itemMgr from "./ItemMgr";
import { loge, ErrList } from "../common/ErrorList";
import { AttrIds } from "../common/G";


class EquipMgr {
    equipList:{[x:number]: EquipData} = {};
    // async init() {
    //     let getRes = (await import("../common/gFunc")).getRes;
    //     let data = await getRes("/prop_data/prop_equip", cc.JsonAsset);
    //     let json = data.json;
    //     this.equipList = json;
    // }

    async init() {
        let RootDir = (await import("../common/gFunc")).RootDir;
        let data = require(RootDir("../app/prop_data/prop_equip"));
        this.equipList = data;
    }

    getEquipData(equipid: number): EquipData | null{
        return this.equipList[equipid];
    }

    genEquip(itemid: number): Equip | null{
        let itemdata = itemMgr.getItemData(itemid);
        if(!itemdata){
            loge(ErrList.Create_Equip_Error_ItemID, itemid);
            return null;
        }
        let equipdata = this.getEquipData(itemdata.kind);
        if(!equipdata){
            loge(ErrList.Create_Equip_Error_EquipID, itemdata.name, itemdata.id, itemdata.kind);
            return null;
        }
        let attrdata = attributeMgr.getAttrData(equipdata.attr);
        if(!attrdata){
            loge(ErrList.Create_Equip_Error_AttrID, itemdata.name, itemdata.id, equipdata.attr);
            return null;
        }

        let equip = new Equip();
        equip.num = 1;

        attributeMgr.setAttr(equip.attr, equipdata.attr);
        for (const key in equip.attr) {
            if (equip.attr.hasOwnProperty(key)) {
                let attrid:AttrIds = Number(key);
                const value = equip.attr[attrid];
                equip.setAttr(attrid, value);
            }
        }
        attributeMgr.setArtiAttr(equip.artiAttr, equipdata.arti, equipdata.artinum);
        for (const key in equip.artiAttr) {
            if (equip.artiAttr.hasOwnProperty(key)) {
                let attrid:AttrIds = Number(key);
                const value = equip.artiAttr[attrid];
                equip.setArtiAttr(attrid, value);
            }
        }
        return equip;
    }
}

let equipMgr = new EquipMgr();
export default equipMgr;