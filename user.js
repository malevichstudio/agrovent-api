import models from "../../models";
import * as randtoken from "rand-token";
import {Op} from "sequelize";

export default class User {
    static resolver() {
        return {
            Query: {
                user: (obj, {id}, context, info) => models.User.findByPk(id),
                users: (obj, args, context, info) => models.User.findAll(),
                clients: (obj, args, context, info) => models.User.findAll({where:{isClient: true}}),
                currentUser: (obj, args, context, info) => context.user,
            },
            User: {
                role: user => user.getRole(),
                companies: user => user.getCompanies(),
            },
            Mutation: {
                signUp: async (obj, {email, name, phone, isClient, password, companyName, country, city, address, position}, context, info) => {
                    const isEmailExist = await models.User.count({
                        where: {
                            email,
                        }
                    });
                    if (isEmailExist) {
                        return {
                            status: false,
                            field: 'email',
                            message: 'signUp.emailExist',
                        };
                    }

                    const isPhoneExist = await models.User.count({
                        where: {
                            phone,
                        }
                    });
                    if (isPhoneExist) {
                        return {
                            status: false,
                            field: 'phone',
                            message: 'signUp.phoneExist',
                        };
                    }

                    const user = await models.User.create({
                        name,
                        email,
                        phone,
                        isClient,
                        priceViewType: isClient ? 'HIDE' : null,
                        passwordHash: await models.User.encryptPassword(password),
                        authKey: randtoken.generate(16),
                        status: 'NOT_ACTIVE',
                        roleId: isClient ? 2 : 16,
                    });

                    if (isClient) {
                        await models.Company.create({
                            name: companyName,
                            country,
                            city,
                            address,
                            position,
                            userId: user.id,
                        });
                    }

                    return {status: true};
                },
                login: async (obj, {email, password}, context, info) => {
                    const user = await models.User.findOne({
                        where: {
                            email,
                            status: 'ACTIVE',
                        }
                    });

                    if (!user || !await user.validatePassword(password)) {
                        return {
                            field: 'email',
                            message: 'login.emailOrPasswordIsIncorrect',
                        };
                    }
                    return {
                        token: await user.login(),
                    };
                },
                addUser: async (obj, {email, name, phone, isClient, password, role, status, priceViewType, visitCardFile, visitCardUrl}, context, info) => {
                    const isEmailExist = await models.User.count({
                        where: {
                            email,
                        }
                    });
                    if (isEmailExist) {
                        return {
                            field: 'email',
                            message: 'user.emailExist',
                        };
                    }

                    const isPhoneExist = await models.User.count({
                        where: {
                            phone,
                        }
                    });
                    if (isPhoneExist) {
                        return {
                            field: 'phone',
                            message: 'user.phoneExist',
                        };
                    }

                    const user = await models.User.create({
                        name,
                        email,
                        phone,
                        isClient,
                        priceViewType,
                        passwordHash: await models.User.encryptPassword(password),
                        authKey: randtoken.generate(16),
                        status,
                        roleId: role,
                    });

                    await user.saveVisitCard(visitCardFile, visitCardUrl);

                    return {
                        user: models.User.findOne({where:{id: user.id}})
                    };
                },
                updateUser: async (obj, {id, email, name, phone, isClient, password, role, status, priceViewType, visitCardUrl, visitCardFile}, context, info) => {
                    const user = await models.User.findByPk(id);

                    if (!user) {
                        throw new Error('User not found');
                    }

                    const isEmailExist = await models.User.count({
                        where: {
                            email,
                            id: {
                                [Op.ne]: id
                            }
                        }
                    });
                    if (isEmailExist) {
                        return {
                            field: 'email',
                            message: 'user.emailExist',
                        };
                    }

                    const isPhoneExist = await models.User.count({
                        where: {
                            phone,
                            id: {
                                [Op.ne]: id
                            }
                        }
                    });
                    if (isPhoneExist) {
                        return {
                            field: 'phone',
                            message: 'user.phoneExist',
                        };
                    }

                    await user.update({
                        name,
                        email,
                        phone,
                        isClient,
                        priceViewType,
                        passwordHash: password ? await models.User.encryptPassword(password) : undefined,
                        status,
                        roleId: role,
                    });

                    await user.saveVisitCard(visitCardFile, visitCardUrl);

                    return {
                        user: models.User.findByPk(user.id),
                    };
                },
                deleteUser: async (obj, {id}, context, info) => {
                    const user = await models.User.findByPk(id);

                    if (!user) {
                        throw new Error('User not found');
                    }

                    if (user.isClient) {
                        const companies = await user.getCompanies();
                        if (companies.length) {
                            return {
                                status: false,
                                message: 'user.needToDeleteCompany',
                            };
                        }
                    }

                    await user.deleteVisitCard();
                    await user.destroy();

                    return {
                        status: true,
                    };
                },
            }
        }
    }

    static typeDefs() {
        return `
            type User {
                id: ID
                name: String
                phone: String
                email: String
                isClient: Boolean
                roleId: Int                
                status: String  
                priceViewType: String              
                visitCard: String              
                createdAt: String
                updatedAt: String
                permissions: [String]
                categories: [Int]
                role: Role
                companies: [Company]
            }
            type UserStatus {
                user: User
                field: String
                message: String 
            }
        `;
    };
}