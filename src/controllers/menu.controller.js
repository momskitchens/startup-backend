import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Menu } from "../models/menu.model.js";
import { Mom } from "../models/mom.model.js";
import mongoose from "mongoose";

const createMenu = asyncHandler(async(req,res)=>{

    const {rice,dal,subji,roti,extra,amount} = req.body
    const mom = req.mom

    // if(!amount || amount > 0 || typeof(amount)!="number"){
    //     throw new apiError(400,"Amount is Invalid")
    // }
 
    const momExits = await Mom.findById(mom._id)
    if(!momExits){
        throw new apiError(400,"Mom does not exits")
    }

    const momId = mom._id

    const newMenu = await Menu.create({
        rice,
        dal,
        subji,
        roti,
        extra,
        amount,
        momId
    })

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            " ",
            "Menu Created!"
        )
    )

})

const allMenus = asyncHandler(async(req,res)=>{
    const menus = await Menu.aggregate([
        [
            {
              $match: {
                active: false, // value has to be true 
              },
            },

          ]
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            menus,
            "Menus Fetched"
        )
    )
})

const fetchMenu = asyncHandler(async(req,res)=>{
  const id = req.params.id;

  const menu = await Menu.findById(id)

   // Check if menu exists
   if (!menu) {
    return  new apiError(404, "Menu not found")
}

  return res
  .status(200)
  .json(
    new apiResponse(
      200,
      menu,
      "Fetched!"
    )
  )

})

const toggleMenuStatus = asyncHandler(async(req,res)=>{
  const {menuId} = req.body
  console.log(menuId)
  
  if (!mongoose.Types.ObjectId.isValid(menuId)) {
    return new apiError(400,"Inavlid Menu")
  }

  const menu = await Menu.findById(menuId)

  if(!menu){
    return new  apiError(400,"Menu does not exit")
  }

  menu.active = !menu.active

  await menu.save()

  return res
  .status(200)
  .json(
    new apiResponse(
        200,
        " ",
        "toggle status of menu!"
    )
  )

})

const deleteMenu = asyncHandler(async(req,res)=>{

    const { menuId } = req.params;

    // Check if menu exists
    const menu = await Menu.findById(menuId);
    if (!menu) {
      return new apiError(404,"Menu Not Found")
    }

    // Delete the menu
    await Menu.findByIdAndDelete(menuId);

   return res
   .status(200)
   .json(
    new apiResponse(200,"","Menu deletd succesfully!!")
   )
  }
)



const momMenus = asyncHandler(async(req,res)=>{
    const mom = req.mom
  
    const menus = await Mom.aggregate([
      [
        {
          $match: {
            _id:mom._id
          }
        },
        {
         $lookup: {
           from: "menus",
           localField: "_id",
           foreignField: "momId",
           as: "momMenus"
         }
        },
        {
          $unwind: {
            path: "$momMenus"
          }
        },
        {
          $project: {
            momMenus:1
          }
        }  
      ]
    ])
  
    return res
    .status(200)
    .json(
      new apiResponse(
        200,
        menus,
        "Mom Menus Fetched"
      )
    )
  
  })
  



export {createMenu,allMenus,momMenus,toggleMenuStatus,deleteMenu,fetchMenu}