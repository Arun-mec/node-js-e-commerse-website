var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const { response } = require('express')
module.exports={

    addProduct:(product,callback)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            var id = JSON.stringify(data.insertedId)
            callback((id.slice(1,-1)))
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        let advertisements = await db.get().collection(collection.AD_COLLECTION).find().toArray()

        resolve({products,advertisements})
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).remove({_id:objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    editProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    name:productDetails.name,
                    category:productDetails.category,
                    price:productDetails.price,
                    description:productDetails.description
                }
            }).then((response)=>{
                resolve()
            })

        })
    },
    addAdvertisements:(adDetails, callback)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection(collection.AD_COLLECTION).insertOne(adDetails).then((data)=>{
                var ad_id = JSON.stringify(data.insertedId)
                callback((ad_id.slice(1,-1)))
            })
        })
    }
}