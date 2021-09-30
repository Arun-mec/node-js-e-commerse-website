var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var ProductHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then(({products,advertisements}) => {
    res.render('admin/view-products', {products, admin:true})
  })
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product')
})
router.post('/add-product', function (req, res) {
  // console.log(req.files.image)
  ProductHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv("../shopping cart/public/public-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err)
      } 
    })
  })
})

router.get('/delete-product', (req, res) => {
  let prodId = req.query.id
  // console.log(prodId)
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id',async (req,res)=>{
  let prodId=req.params.id
  //console.log(prodId)
  product=await productHelpers.editProduct(prodId)
  // console.log(product)
  // console.log(product._id)
  var id = JSON.stringify(product._id).slice(1,-1)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body)
  res.redirect('/admin')
  if(req.files.image){
    let image = req.files.image;
    let id = req.params.id;
    image.mv("../shopping cart/public/public-images/" + id + ".jpg")
  }
})

//advertisements
router.get('/view-advertisements',(req,res)=>{
  productHelpers.getAllProducts().then(({advertisements,products})=>{
    res.render('admin/view-advertisements',{advertisements})
  })
})

router.get('/add-advertisements',(req,res)=>{
  res.render('admin/add-advertisements')
})

router.post('/add-advertisements',(req,res)=>{
  ProductHelpers.addAdvertisements(req.body,(id) => {
    console.log(id)
    let image = req.files.image
    image.mv("../shopping cart/public/ad-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render('admin/add-advertisements')
      } else {
        console.log(err)
      }
    })
  })
  
})
module.exports = router;
