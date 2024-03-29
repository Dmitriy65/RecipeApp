import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import { elements, renderLoader ,clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

const state = {};

const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Search for recipes
            await state.search.getResults();
    
            // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert('Something wrong with the search...');
            console.log(err);
            
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

const controlRecipe = async () => {

    const id = window.location.hash.replace('#', '');

    if (id) {

        recipeView.deleteRecipe();
        
        renderLoader(elements.recipe);
        
        if (state.search) searchView.highlightSelected(id);

        state.recipe = new Recipe(id);

        try {
            
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();   

            
            state.recipe.calcTime();
            state.recipe.calcServings();
            
            
            
            // Render recipe
            clearLoader();    
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            console.log(err);
            clearLoader();
            alert('Error processing recipe!');
        }
    }
};
 
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

const controlList = () => {

    if (!state.list) state.list = new List();

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });

};

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id);
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const value = parseFloat(e.target.value, 10);
        state.list.updateCount(id, value);
    }


});

const controlLike = () => {
    if (!state.likes) state.likes = new Likes(); 
    const currentID = state.recipe.id;

    if (!state.likes.isLiked(currentID)) {
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);
        console.log(state.likes);
            
    } else {
        state.likes.deleteLike(currentID);
        likesView.toggleLikeBtn(false);
        likesView.deleteLike(currentID);
        console.log(state.likes);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes()); 
};

window.addEventListener('load', e => {
   state.likes = new Likes();

   state.likes.readStorage();

   likesView.toggleLikeMenu(state.likes.getNumLikes()); 
   
   state.likes.likes.forEach(like => likesView.renderLike(like)); 
});

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        if (state.recipe.servings > 1) 
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
            state.recipe.updateServings('inc');
            recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }

    
});






