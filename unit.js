import models from "../../models";

export default class Unit {
    static resolver() {
        return {
            Query: {
                unit: (obj, {id}, context, info) => models.Unit.findByPk(id),
                units: (obj, args, context, info) => models.Unit.findAll(),
            },
            Unit: {
                fields: unit => unit.getFields(),
            },
            Mutation: {
                addUnit: async (obj, {titleRU, titleEN}, context, info) => {
                    const unit = await models.Unit.create({
                        titleRU,
                        titleEN,
                    });

                    return {unit};
                },
                updateUnit: async (obj, {id, titleRU, titleEN}, context, info) => {
                    const unit = await models.Unit.findByPk(id);

                    if (!unit) {
                        throw new Error('Unit not found');
                    }

                    await unit.update({
                        titleRU,
                        titleEN,
                    });

                    return {unit};
                },
                deleteUnit: async (obj, {id}, context, info) => {
                    const unit = await models.Unit.findByPk(id);

                    if (!unit) {
                        throw new Error('Unit not found');
                    }

                    const fields = await unit.getFields();

                    if (fields.length) {
                        return {
                            status: false,
                            message: 'units.needToDeleteFields',
                        };
                    }

                    await unit.destroy();

                    return {
                        status: true,
                    };
                },
            }
        }
    }

    static typeDefs() {
        return `
            type Unit {
                id: ID
                titleRU: String    
                titleEN: String                     
                fields: [Field]
                createdAt: String
                updatedAt: String
            }
            type UnitStatus {
                unit: Unit
                field: String
                message: String 
            }
        `;
    };
}