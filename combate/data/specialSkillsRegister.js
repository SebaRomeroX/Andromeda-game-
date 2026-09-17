
createSkill({
    name: "Ejecutor",
    type: "attack",
    precision: 85,
    aparicion: 20,
    description: "Causa mas daño cuando menor sea la vida actual del enemigo",
    customEffect: (actor, target, skill, ctx) => {
        const hpPercent = target.currentHp / target.hp;
        const rawDmg = Math.round(5 + 45 * Math.pow((1 - hpPercent) / 0.75, 2.8));
        const defSkill = target.defense;
        const defBuffsVal = ctx.defBuffs ?? 0;
        const def = ctx.hasDefDebuff
        ? Math.round((defSkill + defBuffsVal) / 2)
        : defSkill + defBuffsVal;
        const finalDmg = Math.max(0, rawDmg - def);
        return {
        type: "attack", rawDmg, finalDmg, def,
        defBuffs: ctx.defBuffs ?? 0,
        atkMult: ctx.atkMult ?? 1,
        stun: false, wound: false
        };
    },
    levelBonuses: {
        2: { precision: 2 },
        3: { precision: 2 },
        4: { precision: 1 }
    }
})