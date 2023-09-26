const app = require('../app');
const helper = require('../helper');
const query = require('../queries');
const express = require('express');
const router = express.Router();

router.get('/', helper.ensureAuthentication, async function (req, res, next){
    let options = {};
    const userId = req.session.user.id;
    const lists = await query.getListsByUserId(userId);
    options.lists = lists;
    console.log(options);
    return res.render('userLists', {options})
});

router.get('/list/:id', helper.ensureAuthentication, async function(req, res, next){
    let options = {};
    const listId = req.params.id;
    const list = await query.getListByListId(listId);
    options.list = list;

    return res.render('list', {options});

});

router.post('/list/:listId/crossOffItem/:itemIndex', helper.ensureAuthentication, async function(req, res, next){
    const listId = req.params.listId;
    const itemIndex = req.params.itemIndex;

    const list = await query.getListByListId(listId);
    if(list.items[itemIndex].isCrossed){
        list.items[itemIndex].isCrossed = false;
    }
    else{
        list.items[itemIndex].isCrossed = true;
    }
    await query.updateItems(listId, list.items);

    res.json({ success: true });
});

router.post('/list/:listId/removeItem/:itemIndex', helper.ensureAuthentication, async function(req, res, next){
    const listId = req.params.listId;
    const itemIndex = req.params.itemIndex;

    const list = await query.getListByListId(listId);
    list.items.splice(itemIndex, 1);
    await query.updateItems(listId, list.items);

    return res.json({ success: true });
});

router.get('/list/:listId/removeAll', helper.ensureAuthentication, async function(req, res, next){
    const listId = req.params.listId;

    const list = await query.getListByListId(listId);
    list.items = [];
    await query.updateItems(listId, list.items);

    return res.redirect(`/lists/list/${listId}`);

});

router.post('/list/:listId/addItem', helper.ensureAuthentication, async function(req, res, next){
    //need to sanitize values
    const listId = req.params.listId;
    const newQty = req.body.quantity;
    const newUnit = req.body.unit;
    const newItem = req.body.item;
    if (!newItem){
        req.flash('error', 'An item is required to add to a list.');
        return res.redirect(`/lists/list/${listId}`);
    }
    const itemToAdd = {
        quantity: newQty,
        unit: newUnit,
        item: newItem
    }
    const newItemArr = [newQty, newUnit, newItem];
    const list = await query.getListByListId(listId);
    list.items.push(itemToAdd);
    await query.updateItems(listId, list.items);
    return res.json({ success: true , newItemArr: newItemArr});
});

router.post('/addFromRecipe/:listId', helper.ensureAuthentication, async function (req, res, next){
    const listId = req.params.listId;
    const recipeId = req.body.recipeId;
    const ingredientIndexes = req.body.ingredientIndexes;
    console.log(listId);
    console.log(recipeId);
    console.log(ingredientIndexes);

    const recipe = await query.getRecipeById(recipeId);
    const list = await query.getListByListId(listId);
    console.log(recipe.ingredients.length);
    for (let i = 0; i < recipe.ingredients.length; i++){
        if (ingredientIndexes.includes(i)){
            list.items.push({
                quantity: recipe.ingredients[i].quantity,
                unit: recipe.ingredients[i].unit,
                item: recipe.ingredients[i].ingredient
            });
        }
    }

    await query.updateItems(listId, list.items);

    return res.json({ success: true });
});

router.get('/newList', helper.ensureAuthentication, async function (req, res, next) {
    res.render('newList', undefined);
});

router.post('/newList', helper.ensureAuthentication, async function (req, res, next) {
    const userId = req.session.user.id;
    const listTitle = req.body.title;
    let quantities = helper.checkForSingleInput(req.body.quantities);
    let units = helper.checkForSingleInput(req.body.units);
    let items = helper.checkForSingleInput(req.body.items);
    let list = [];
    for (let i = 0; i < items.length; i++){
        if (!items[i]){
            quantities.splice(i,i);
            units.splice(i,i);
            items.splice(i,i);
        }
        else{
            list.push({
                quantity: quantities[i],
                unit: units[i],
                item: items[i],
                isCrossed: false
            })
        }
    }
    const newList = await query.createList(userId, listTitle, list);
    console.log(newList);
    return res.redirect(`/lists/list/${newList.id}`);
});

router.get('/deleteList/:id', helper.ensureAuthentication, async function (req, res, next){
    const listId = req.params.id;
    await query.deleteList(listId);
    req.flash('success', 'List deleted successfully.');
    return res.redirect('/lists');
});

module.exports = router;