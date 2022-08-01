//const validate = require("../validator/validator");
const productModel = require('../model/productModel');
const userModel = require('../model/userModel');
const cartModel = require('../model/cartModel');
const mongoose = require("mongoose")


//validation 
let isValidRequestBody = function (body) {
    if (Object.keys(body).length === 0) return true;
    return false;
}
let isValidObjectId = function (ObjectId) {
    return mongoose.isValidObjectId(ObjectId)
}
let isEmpty = function (value) {
    if (typeof value === 'undefined' || value === null) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;
    return false;
}
//Create Cart Api
exports.createCart = async function (req, res)  {
    try {

        let data = JSON.parse(JSON.stringify(req.body));
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });

        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        //getting token from req in auth    
        const tokenUserId = req.decodeToken.userId;
        let { productId, cartId, quantity } = data
        if (isEmpty(productId))
            return res.status(400).send({ status: false, message: "product required" })

        if (!quantity) {
            quantity = 1
        }
        quantity = Number(quantity)
        if (typeof quantity !== 'number')
            return res.status(400).send({ status: false, message: "quantity is number" })
        if (quantity < 1)
            return res.status(400).send({ status: false, message: "quantity cannot be less then 1" })
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" })
        if (cartId) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
        }

        //checking for valid user
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser) return res.status(404).send({ status: false, message: "User does not exists" })

        if (cartId) {
            var findCart = await cartModel.findOne({ _id: cartId })
            if (!findCart)
                return res.status(404).send({ status: false, message: "Cart does not exists" })
        }

        // user authorization    
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });

        //searching for product    
        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

        let validCart = await cartModel.findOne({ userId: userId })
        if (!validCart && findCart) {
            return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
        }
        if (validCart) {
            if (cartId) {
                if (validCart._id.toString() != cartId)
                    return res.status(403).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
            }
            let productidincart = validCart.items
            let uptotal = validCart.totalPrice + (validProduct.price * Number(quantity))
            let proId = validProduct._id.toString()
            for (let i = 0; i < productidincart.length; i++) {
                let productfromitem = productidincart[i].productId.toString()

                //updates old product i.e QUANTITY
                if (proId == productfromitem) {
                    let oldQuant = productidincart[i].quantity
                    let newquant = oldQuant + quantity
                    productidincart[i].quantity = newquant
                    validCart.totalPrice = uptotal
                    await validCart.save();
                    // let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
                    return res.status(200).send({ status: true, message: 'Success', data: validCart })
                }
            }
            //adds new product
            validCart.items.push({ productId: productId, quantity: Number(quantity) })
            let total = validCart.totalPrice + (validProduct.price * Number(quantity))
            validCart.totalPrice = total
            let count = validCart.totalItems
            validCart.totalItems = count + 1
            await validCart.save()
            //let result = await cartModel.findOne({ _id: userId }).select({ "items._id": 0, __v: 0 })
            return res.status(200).send({ status: true, message: 'Success', data: validCart })
        }

        // 1st time cart
        let calprice = validProduct.price * Number(quantity)
        let obj = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: calprice,
        }
        obj['totalItems'] = obj.items.length
        let result = await cartModel.create(obj)
        // let result = await cartModel.findOne({ _id: cartId }).select({ "items._id": 0, __v: 0 })
        return res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}
// ----------------------------------- get cart
exports.getCart = async (req,res) =>{
    try{
         let userId = req.params.userId;
      
         //checking if the cart is present with this userId or not
         let findCart = await cartModel.findOne({userId : userId}).populate('items.productId');
         if(!findCart) return res.status(404).send({ status: false , message: `No cart found with this ${userId} userId`});

         return res.status(200).send({status: true , message: "Success" ,data:findCart});

    }catch(error){
        return res.status(500).send({ status: false, message:error.message});
    }
}


// ---------------------------- PUT /users/:userId/cart -------------------------------------------

exports.updateCart = async(req, res) => {
    try{

        let userId = req.params.userId;
        let data = req.body
        
        // checking if cart is present or not
        let cart = await cartModel.findOne({userId :userId, _id: data.cartId});
        if(!cart){
            return res.status(400).send({ status: false , message: `No cart found with this ${userId} userId`});
        }

        //checking if cart is emoty or not
        if(cart.items.length == 0){
            return res.status(400).send({ status: false , message: "Cart is empty"});
        }

        
        //
        if(validate.isValid(data)){
            return res.status(400).send({ status: false , message: "Please provide details to remove product from cart "});
        }
        if(data.totalPrice || data.totalItems || typeof data.totalPrice == "string" || typeof data.totalItems == "string"){
            return res.status(400).send({status: false, message: "Cannot change or update total price or total Items"})
        }
        if(data.cartId || typeof data.cartId == "string"){
            if(validate.isValid(data.cartId)){
                return res.status(400).send({ status: false , message: "Please provide valid cart Id"});
            }
            if(!validate.isValidObjectId(data.cartId)){
                return res.status(400).send({ status: false , message: "Provide Valid Cart Id"});
            }
            if(cart._id.toString() !== data.cartId){
                return res.status(400).send({status: false, message: "cart Id is invalid. Please provide correct cart Id"})
            }
        }
        if(validate.isValid(data.productId)){
            return res.status(400).send({ status: false , message: "Please provide product Id "});
        }
        if(!validate.isValidObjectId(data.productId)){
            return res.status(400).send({status: false, message: "Please provide valid product Id"})
        }
        let findProduct = await productModel.findById({_id : data.productId})
        if(!findProduct){
            return res.status(404).send({status: false, message: "No product found with this product Id"})
        }
        if(data.removeProduct == "undefined"){
            return res.status(400).send({status: false, message: "removeProduct is required"})
        }
        if(!(/0|1/.test(data.removeProduct))){
            return res.status(400).send({status: false, message: "removeProduct should be either 0 or 1"})
        }

        let productArr = cart.items.filter(x => {
            x.productId.toString() == data.productId
            console.log(productArr)
        })
        if(productArr.length == 0){
            return res.status(400).send({status: false, message: "Product is not present in cart"})
        }

        let index = cart.items.indexOf(productArr[0])
        if(data.removeProduct == 0){

            cart.totalPrice = cart.totalPrice - findProduct.price * cart.items[index].quantity.toFixed(2)
            cart.items.splice(index, 1)
            cart.totalItems = cart.items.length
            cart.save()
        }
        return res.status(200).send({status: true, message: "Data updated successfuly", data: cart})       

    } catch(error){
        return res.status(500).send({status: false, message: error.message})
    }

}