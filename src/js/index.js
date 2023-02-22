import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/list';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base'

/** Global state of the app
 * -Search the object
 * - Current recipe object
 * - Shopping list object
 * - liked recipes
 */
const state = {}

/** 
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();
 
    if(query){
        // 2. new search object add to stat
        state.search = new Search(query);

        // 3. prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        //4. search for recipes
        try {
            await state.search.getResults();

            //5. render results on UI
            clearLoader();
            searchView.renderResults(state.search.results);
        } catch (error) {
            alert('Something wrong with the search...');
            clearLoader();
        };
        
    }
}

elements.searchForm.addEventListener('submit', e=> {
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage =parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.results, goToPage);
        
    }
})

/** 
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    // GET ID from url
    const id = window.location.hash.replace('#', '');

    if(id) {
        // perpare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);

      try {
            //Get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();

        //calculate servings and time 
        state.recipe.calcTime();
        state.recipe.calacServings(); 

        // Render recipe
        clearLoader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
        );

       } catch (err) {
           alert('Error processing recipe');
       }
    }
}

// window.addEventListener('hashchange', controlRecipe)
// window.addEventListener('load', controlRecipe)

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/** 
 * list CONTROLLER
*/
const controlList = () => {
    //creat a new list if there in none yet
    if(!state.list) state.list = new List();

    //add each ingredients in the list and UI
     state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}

//Handle delete and update list item event
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid
    //handel the delet btn
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delet from state
        state.list.deleteItem(id);

        //Delete from UI
        listView.deleteItem(id);

        //handel the count Update
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10); 
        state.list.updateCount(id, val)
    }
})

/** 
 * likes CONTROLLER
*/

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has NOT yet liked current recipe
    if(!state.likes.isLiked(currentID)){
        //add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle the like button
            likesView.toggleLikeBtn(true)
        //add like to the UI list
        likesView.renderLike(newLike)



    //user has NOT yet liked current recipe
    } else {
        //remove like from state
        state.likes.deleteLike(currentID)
        //toggle the like button
        likesView.toggleLikeBtn(false)
        //remove like from the UI list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes())
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    //Restore Likes
    state.likes.readStorage();

    //toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the exist likes
    state.likes.likes.forEach(like => likesView.renderLike(like))
});


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decreas, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1){
        state.recipe.updateServings('dec')
        recipeView.updateServingsIngredients(state.recipe);
        }
    } else if(e.target.matches('.btn-increase, .btn-increase *')){
        // Increase button is clicked
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe);
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //add ingredients to shopping list
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller
        controlLike();
    }
});

