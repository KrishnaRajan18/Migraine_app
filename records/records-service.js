const RecordsService = {
    
    getAllRecords(knex) {
        return knex.select('*').from('migraine_records')
    },
    insertRecord(knex, newRecord) {
        return knex
            .insert(newRecord)
            .into('migraine_records')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    insertUserRecord(knex, newRecord) {
        return knex
            .insert(newRecord)
            .into('migraine_records')
            .where('user_id', newRecord.user_id)
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteRecord(knex, id) {
        return knex('migraine_records')
            .where({ id })
            .delete()
    },
    getById(knex, id) {
        return knex
            .from('migraine_records')
            .select('*')
            .where('id', id)
            .first()
    },
    updateRecord(knex, id, newRecordFields) {
        return knex('migraine_records')
            .where({ id })
            .update(newRecordFields)
    },
}

module.exports = RecordsService