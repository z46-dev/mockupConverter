let mockupsToDef = (() => {
    function rounder(t) {
        let r = (t = t.toString()).split(".")[1];
        if (r) {
            let e = !0,
                l = +r[0] > 4;
            for (let t = 0; t < 4; t++) + r[t] > 4 !== l && (e = !1);
            return e && (l || (t = Math.floor(+t)), l && (t = Math.ceil(+t))), +t
        }
        return +t
    }
    let mockups = JSON.parse(require("fs").readFileSync(__dirname + "/mockups.json"), "utf-8");

    function convert(index, exportName = false, returnValue = false) {
        if (typeof index === "string") index = mockups.findIndex(mockup => mockup.name === index);
        const mockup = mockups[index];
        if (!exportName) {
            let words = mockup.name.split(" ");
            words[0] = words[0].split("");
            words[0][0] = words[0][0].toLowerCase();
            words[0] = words[0].join("");
            exportName = words.join("");
        }
        let premade = [];
        let {
            guns,
            turrets
        } = mockup;
        guns = guns.map(gun => {
            let {
                length,
                width,
                aspect,
                angle,
                direction,
                offset
            } = gun;
            let output = [length * 10, width * 10, aspect];
            output[output.length - 1] = +output[output.length - 1].toFixed(3);
            output.push((Math.round(offset * Math.cos(direction) * 1000000) / 1000000) * 10);
            output.push((Math.round(offset * Math.sin(direction) * 1000000) / 1000000) * 10);
            output.push(rounder((180 / Math.PI) * angle));
            return { position: output, raw: gun };
        });
        turrets = turrets.map(turret => {
            let {
                index,
                x,
                y,
                angle,
                direction,
                offset,
                sizeFactor,
                layer,
                color
            } = turret;
            let existing = premade.find(entry => entry.index === index);
            let turretExportName = `${exportName}Turret${existing ? premade.indexOf(existing) : premade.length}`;
            if (!existing) {
                premade.push({
                    index,
                    code: convert(index, turretExportName, true),
                    turretExportName
                });
            }
            let output = [sizeFactor * 20];
            output.push((Math.round(offset * Math.cos(direction) * 1000000) / 1000000) * 10);
            output.push((Math.round(offset * Math.sin(direction) * 1000000) / 1000000) * 10);
            output.push(rounder((180 / Math.PI) * angle), 0, layer, color, turretExportName);
            output[3] = +output[3].toFixed(3);
            return output;
        });
        let output = `exports.${exportName} = {\n    PARENT: [exports.genericTank],\n    LABEL: "${mockup.name}",`;
        if (mockup.color !== 16) {
            output += `\n    COLOR: ${mockup.color},`;
        }
        if (mockup.shape !== 0) {
            output += `\n    SHAPE: ${mockup.shape},`;
        }
        if (guns.length) {
            output += "\n    GUNS: [";
            for (let gun of guns) {
                let props = `{\n${gun.raw.color !== 16 ? `            COLOR: ${gun.raw.color},` : ""}`;
                if (gun.raw.skin !== 0) {
                    props += `${gun.raw.color !== 16 ? "\n" : ""}${gun.raw.skin !== 0 ? `            SKIN: ${gun.raw.skin},` : ""}`;
                }
                props = props.slice(0, -1);
                props += "\n        }";
                output += `{\n        POSITION: [${gun.position.join(", ")}, 0]${(gun.raw.color !== 16 || gun.raw.skin !== 0) ? `,\n        PROPERTIES: ${props}` : ""}\n    }, `;
            }
            output = output.slice(0, -2);
            output += "],";
        }
        if (turrets.length) {
            output += "\n    TURRETS: [";
            for (let turret of turrets) {
                let exportName = turret.pop();
                let color = turret.pop();
                let typePart = (color === 16) ? `exports.${exportName}` : `[exports.${exportName}, { COLOR: ${color} }]`;
                output += `{\n        POSITION: [${turret.join(", ")}],\n        TYPE: ${typePart}\n    }, `;
            }
            output = output.slice(0, -2);
            output += "];";
        }
        output = output.slice(0, -1);
        output += "\n};";
        if (premade.length) {
            for (let tank of premade) {
                output = `${tank.code}\n${output}`;
            }
        }
        if (returnValue) return output;
        console.log(output);
    }
    return convert;
})();
require("fs").writeFileSync(__dirname + "/output.txt", mockupsToDef(process.argv.slice(3).join(" "), process[2], true), "utf-8");
