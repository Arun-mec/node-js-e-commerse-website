// const { response } = require("express");
// const { parse } = require("handlebars");

function addtoCart(prodId){
    $.ajax({
        url:'/add-to-cart/'+prodId,
        method:'get',
        success:(res)=>{
            if(res.state){
                let count = $('#cart-count').html();
                count = parseInt(count)+1;
                $('#cart-count').html(count);
            }
        }
    })
}

function changeQty(cartId,prodId,count){
    let quantity = parseInt(document.getElementById(prodId).innerHTML);
    let totalAmt = parseInt(document.getElementById(total))
    let price = parseInt(document.getElementById(prodPrice))
    count=parseInt(count);
    $.ajax({
        url:'/change-pdt-quantity',
        data:{
            cartId:cartId,
            prodId:prodId,
            count:count,
            quantity:quantity
        },
        method:'POST',
        success:(response)=>{
            if(response.removeProduct){
                alert("Product Removed Successfully")
                location.reload()
            }
            else{
                document.getElementById(prodId).innerHTML=quantity+count;
                //  document.getElementById(total).innerHTML = totalAmt+(price * count)
                alert("Succesfull")
                location.reload()
                
            }
        }
    })
}

function removeProduct(cartId, prodId){
    $.ajax({
        url:'/remove-cart-product',
        data:{
            cartId:cartId,
            prodId:prodId
        },
        method:'POST',
        success:(response)=>{
            if(response.removeProduct){
                alert('Product Removed Succesfully')
                location.reload()
            }
        }
})
}

function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_rd2UqXBrgdjudp", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "shopping cart",
        "description": "Test Transaction",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)


            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Arun A",
            "email": "example@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata.order_id);
        alert(response.error.metadata.payment_id);
    });
    rzp1.open();
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {payment, order},
        method: 'post',
        success:(response)=>{
            if(response.status){
                window.location.href='/order-success/'+response.userId
            }else{
                swal({
                    text:'Order Failed',
                    button:'failure',
                })
            }
        }
    })
}