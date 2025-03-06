import { Router } from "express";
import { createMenu,allMenus,momMenus,toggleMenuStatus,fetchMenu, deleteMenu } from "../controllers/menu.controller.js";
import { verifyMOMJWT } from "../middlewares/momAuth.middleware.js";


const menuRouter = Router()

menuRouter.route("/create-menu").post(verifyMOMJWT,createMenu)

menuRouter.route("/menus").get(allMenus)

menuRouter.route("/menus/:id").get(fetchMenu)

menuRouter.route("/mom-menus").get(verifyMOMJWT,momMenus)

menuRouter.route("/toggle-active").patch(toggleMenuStatus)

menuRouter.route("/delete-menu/:menuId").delete(deleteMenu)

export default menuRouter