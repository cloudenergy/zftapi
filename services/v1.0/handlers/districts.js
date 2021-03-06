'use strict'
const validator = require('validator')

/**
 * Operations on /houses/format
 */
module.exports = {
  /**
     * summary: get house format
     * description: get houese list

     * parameters: projectid
     * produces: application/json
     * responses: 200, 400
     */
  get: (req, res)=>{
    /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
    const param = req.query
    const level = param.level

    let where = {
      enable: 1
    }
    if(param.cityId){
      if(!validator.isInt(param.cityId, {min:0, max: 999999})){
        return res.send(442, ErrorCode.ack(ErrorCode.PARAMETERERROR, {cityId: param.cityId}))
      }
      if(!validator.isLength(param.cityId.toString(), {min:6, max: 6})){
        return res.send(442, ErrorCode.ack(ErrorCode.PARAMETERERROR, {cityId: param.cityId}))
      }

      where = {
        parent: param.cityId
      }
    }
    if(level){
      where.level = level
    }

    MySQL.Divisions.findAll({
      where: where,
      attributes: ['id', ['title', 'name'], 'latitude', 'longitude']
    }).then(
      data=>{
        res.send(ErrorCode.ack(ErrorCode.OK, data))
      },
      err=>{
        log.error(err, where)
        res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC))
      }
    )
  }
}
