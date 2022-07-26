const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')
const mid = require("../middleware/auth");

// ---------------------------------------- USER API's -------------------------------------------
router.post("/register", userController.createUser)

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile",mid.Authentication,mid.Authorization, userController.getUser)

router.put("/user/:userId/profile", mid.Authentication,mid.Authorization,userController.updateUser)



// ---------------------------------------- PRODUCT API's -------------------------------------------

router.post('/products', productController.createProduct)

router.get('/products', productController.getProduct)

router.get('/products/:productId',productController.getProductById)

router.put('/products/:productId',productController.updateProduct)

router.delete( "/products/:productId",productController.deletebyId)



// ---------------------------------------- CART API's -------------------------------------------
router.post("/users/:userId/cart",mid.Authentication,mid.Authorization,cartController.createCart)

router.get("/users/:userId/cart",mid.Authentication,mid.Authorization,cartController.getCart)

router.put('/users/:userId/cart', mid.Authentication,mid.Authorization,cartController.updateCart)

router.delete('/users/:userId/cart',mid.Authentication,mid.Authorization, cartController.deleteCart)



// ---------------------------------------- ORDER API's -------------------------------------------

router.post("/users/:userId/orders",mid.Authentication,mid.Authorization,orderController.createOrder)

router.put("/users/:userId/orders",mid.Authentication,mid.Authorization,orderController.updateOrder)



module.exports = router