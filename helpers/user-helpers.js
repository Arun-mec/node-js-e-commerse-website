var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
var objectId = require('mongodb').ObjectId
const { response } = require('express')
const { ConnectionClosedEvent } = require('mongodb')
const { USER_COLLECTION } = require('../config/collections')
const Razorpay = require('razorpay')
const crypto = require('crypto');
var instance = new Razorpay({ key_id: 'rzp_test_rd2UqXBrgdjudp', key_secret: 'OyrRYH1pNSVLssCkURNxQN7h' })

module.exports={
    consoleSomething:()=>{
        console.log("Hello");
    },
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{   
            let response={}
            userData.password= await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response)=>{
                resolve(response)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({emailid:userData.emailid})
            if (user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if (status){
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        resolve({status:false})
                        console.log('login failed')
                    }
                })
            }else{
                resolve({status:false})
                console.log("login failed")
            }
        })
    },
    addToCart:(prodId,userId)=>{
        let prodObj={
            item:objectId(prodId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)});
            if(userCart){
                let prodExist=userCart.products.findIndex(product=>product.item==prodId)
            //console.log(prodExist)
            if (prodExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(prodId)},
                {
                    $inc:{'products.$.quantity':1}
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                        $push:({products:prodObj})
                }).then((response)=>{
                    resolve(response)
                })
            }
            }else{
                let cartObj = {
                    user:objectId(userId),
                    products:[prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve(response)
                })

            }
        })
    },
    getCartproducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems =await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:['$product',0]
                        }

                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{prodList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id',"$$prodList"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            resolve(cartItems);
            // console.log(cartItems)
        })
    },
    getCartcount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)});
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(cartDetails)=>{
        count=parseInt(cartDetails.count)
        quantity=parseInt(cartDetails.quantity)
        // console.log(cartDetails.cartId,cartDetails.prodId)
        return new Promise((resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(cartDetails.cartId)},
                {
                    $pull:{
                        products:{item:objectId(cartDetails.prodId)}}
                }).then((response)=>{
                        resolve({removeProduct:true})
                    })
                }
            else{
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(cartDetails.cartId),'products.item':objectId(cartDetails.prodId)},
                    {
                        $inc:{'products.$.quantity':count}
                    }).then((response)=>{
                    resolve(true)
                    })
            }

    })
    },
    removeCartProduct:(cartDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(cartDetails.cartId)},{
                $pull:{
                    products:{item:objectId(cartDetails.prodId)}}
            }).then((response)=>{
                resolve({removeProduct:true})
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total =await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{
                            $arrayElemAt:['$product',0]
                        }

                    }
                },              
                {
                    $group:{
                        _id:null,
                        total:{ $sum:{ $multiply:[
                            {
                                $convert:{
                                    input:'$quantity',
                                    to:"int"
                                }
                            },{
                                $convert:{
                                    input:'$product.price',
                                    to:"int"
                                }
                            }]}
                        }
                    }
                }
            ]).toArray()
            //console.log(total[0])
            resolve(total[0].total);
            // console.log(cartItems)
        })
        
    },
    getOrderProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            // console.log(cart)
            resolve(cart.products)
        })
    },
    placeOrder:(orderDetails,products,total)=>{
        return new Promise((resolve,reject)=>{
            // console.log(orderDetails,products,total)
            let status=orderDetails.payment === 'cod'?'Order Placed Succesfully':'Order Pending';
            let orderObj = {
                deliveryDetails : {
                    mobile:orderDetails.number,
                    address: orderDetails.address,
                    pincode: orderDetails.pincode
                },
                userId : objectId(orderDetails.userId),
                payment : orderDetails.payment,
                products : products,
                status : status,
                totalAmt: total,
                date : new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                var orderId = orderObj._id;
                resolve(orderId)
            })
        })
    },

    getOrderDetails:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)})
            resolve(orderDetails)
        })
        
    },
    userDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            // db.get().collection(collection.CART_COLLECTION).findOne({})
            resolve(userDetails)
        })
    },
    removeUserCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(userId)})
        })
    },
    getOrderHistory:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderHistory = await db.get().collection(collection.ORDER_COLLECTION).find(
                {userId : 
                    {   $all: [ objectId(userId) ]
                    }}).toArray()
            resolve(orderHistory)
        })
    },
    generateRazorpay:(orderId,amount)=>{
        return new Promise((resolve,reject)=>{
            // console.log(orderId);
            var options = {
                amount: amount*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                // console.log(order);
                resolve(order)
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            let hmac = crypto.createHmac('sha256', 'OyrRYH1pNSVLssCkURNxQN7h');
            hmac.update(details['payment[razorpay_order_id]']+"|"+details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if (hmac===details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'Order Placed Succesfully'
                }
            }).then(()=>{
                resolve()
            })
        })
    }

}