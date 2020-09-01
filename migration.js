'use strict';
const TIMESTAMP = require('../dataTypes/timestamp');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Groups', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            titleRU: {
                type: Sequelize.STRING,
            },
            titleEN: {
                type: Sequelize.STRING,
            },
            parentId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            createdAt: {
                allowNull: false,
                type: TIMESTAMP,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                allowNull: false,
                type: TIMESTAMP,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            }
        }, {
            charset: 'utf8',
            collate: 'utf8_unicode_ci'
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('Groups');
    }
};
