var express = require('express');
const { ConnectionClosedEvent } = require('mongodb');
const { resolve } = require('promise');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var invoiceHelpers = require('../helpers/invoice-helpers')
var userHelper = require('../helpers/user-helpers')
var fillPdf = require('fill-pdf');
var fs =require("fs")
var pdfkit =require('pdfkit');
const { fileURLToPath } = require('url');

//middleware
const verifyLogin = (req,res,next)=>{
  if (req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  let cartCount=null
  // console.log(cartCount)
  if (req.session.user){
    cartCount = await userHelpers.getCartcount(req.session.user._id);
    console.log(cartCount)
  }
  products = productHelpers.getAllProducts().then(({products,advertisements})=>{
    for(let i=0;i<advertisements.length;i++){
      advertisements[i]['serialNo']=i;
      if (i==1){
        advertisements[i]['default']=true;
      }else{
        advertisements[i]['default']=false;
      }
    }
    //  userHelpers.consoleSomething()
    res.render('user/view-products',{products,advertisements,user,cartCount})

  })
});
//user login
router.get('/login',(req,res)=>{
  if (req.session.loggedIn){
    res.redirect('/')
  }else{
  res.render('./user/user-login',{"loginError":req.session.loginError})
  req.session.loginError=false
}
});


router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if (response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/') 

    }else{
      req.session.loginError="Invalid username and password"
      res.redirect('/login')
    }
  })
});
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
});

//user signup
router.get('/signup',(req,res)=>{
  res.render('./user/user-signup')
});
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true;
    req.session.user=response;
    res.redirect('/')
  })
});
//cart signup
router.get('/cart',verifyLogin,async (req,res)=>{
  let products= await userHelpers.getCartproducts(req.session.user._id)
  let totalValue = 0;
  if (products.length>0)
  {
    let totalValue= await userHelpers.getTotalAmount(req.session.user._id)
  }
  //console.log(products)
  res.render('user/cart',{products,totalValue,user:req.session.user,userId:req.session.user._id})
})

router.get('/add-to-cart/:id',(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({state:true})
   //res.redirect('/')
  })
})

router.post('/change-pdt-quantity',(req,res,next)=>{
  // console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    //console.log(response)
    res.json(response)
  })
})

router.post('/remove-cart-product',(req,res)=>{
  console.log(req.body)
  userHelpers.removeCartProduct(req.body).then((response)=>{
    res.json(response)
    console.log(response)
  })
})

router.get('/place-order',verifyLogin,async (req,res)=>{
  //console.log(req.session.user._id)
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getOrderProducts(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if (req.body['payment']==='cod'){
      res.json({codSuccess:true,Id:orderId})
    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })
    }
    // console.log(orderId)
    
  })
// console.log(req.body)
})

 router.get('/placed-order/:id',async(req,res)=>{
  let orderDetails = await userHelpers.getOrderDetails(req.params.id)
  // console.log(orderDetails)
  let products = await userHelpers.getCartproducts(orderDetails.userId)
  // console.log(products)
  let userDetails = await userHelpers.userDetails(orderDetails.userId)
  // console.log(userDetails)
  const invoice = {
    shipping: {
      name: userDetails.fname,
      address: orderDetails.deliveryDetails.address,
      postal_code: orderDetails.deliveryDetails.pincode,
      mobile : orderDetails.deliveryDetails.mobile
    },
      amount:orderDetails.totalAmt,
      products : products,
      invoice_nr:orderDetails._id,
      date: orderDetails.date,
      status : orderDetails.atatus
  }
  //console.log(invoice)
  path='templetes/'+ orderDetails._id +'.pdf'

  invoiceHelpers.createInvoice(invoice, path)
  userHelpers.removeUserCartProducts(orderDetails.userId)
  res.render('user/orderConfirm',{orderId:orderDetails._id, userId:orderDetails.userId})
 })  

router.get('/print-invoice/:orderid',(req,res)=>{
  var PDFfilename = req.params.orderid;
  var PDFfile = fs.readFileSync('./templetes/'+PDFfilename+'.pdf')
  res.contentType("application/pdf");
  res.send(PDFfile)
})

router.get('/order-history/:userid',async(req,res)=>{
  let orderHistory = await userHelpers.getOrderHistory(req.params.userid)
  // let products = await userHelpers.getCartproducts(req.param.userId)
  res.render('user/orderHistory',{orderHistory:orderHistory})

  // console.log(orderHistory)
})

router.post('/verify-payment',(req,res)=>{
  // console.log(req.session.user)
  // console.log(req.body);
  userHelpers.verifyPayment(req.body).then((response)=>{
    // resolve(resonse)
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      // console.log('successfull!!')
      res.json({status:true,userId:req.session.user._id})
    })
  }).catch((err=>{
    res.json({status:false,errMsg:"Payment Failed"})
  }))
})

router.get('/order-success/:id',(req,res)=>{
  userHelpers.removeUserCartProducts(req.params.id)
  res.render('user/orderSuccess',{userId:req.params.id})
})
module.exports = router;
