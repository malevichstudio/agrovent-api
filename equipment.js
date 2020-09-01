'use strict';
import * as Sequelize from "sequelize";

export default class Equipment extends Sequelize.Model {
    static init = (sequelize, DataTypes) => (
        super.init(
            {
                titleRU: DataTypes.STRING,
                titleEN: DataTypes.STRING,
                vendorCode: {
                    type: DataTypes.INTEGER,
                    allowNull: false,

                },
                currencyId: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                code: DataTypes.STRING,
                basePrice: DataTypes.FLOAT,
                margin: DataTypes.INTEGER,
                priceType: DataTypes.ENUM('PRICE', 'MARGIN'),
            }, {
                sequelize
            }
        )
    );

    static associate = models => {
        this.belongsTo(models.Currency);
        this.belongsToMany(models.Group, {through: models.GroupEquipment});
        this.hasMany(models.ParamValue);
        this.hasMany(models.CalculationEquipment);
    };

    getKits = async () => (
        this.sequelize.models.Kit.findAll({
            where: {
                parentId: this.id,
            },
        })
    );

    getKitValues = async calculation => {
        const kits = await this.getKits();

        const result = [];

        for (const kit of kits) {
            const child = await kit.getChild();
            result.push({
                child: child,
                quantity: kit.quantity,
                price: await child.getConvertedPrice(calculation),
            });
        }

        return result;
    };

    getConvertedPrice = async calculation => {
        let price = this.basePrice;

        if (this.priceType === 'MARGIN') {
            price = Math.round(this.basePrice * (1 + this.margin / 100) * 100) / 100;
        }

        price = price + Math.round(price * calculation.discount) / 100;
        if (calculation.currencyId !== this.currencyId) {
            const currency = await calculation.getCurrency();

            price = Math.round(price * this.sequelize.models.Calculation.convertToCurrency(currency.title, calculation.rate) * 100) / 100;
        }
        return price;
    };
}
