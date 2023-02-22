import axios from 'axios';

export default class Recipe {
    constructor(id){
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`)
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
            console.log(this.ingredients)
            
           
        } catch (error){
            console.log(error);
            alert('Somthing went wrong :(');
            
        }
    }

    calcTime() {
        //asume that for every 3 ingredients, we need 15 minutes
        //num of ingredients = numIng
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calacServings () {
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon','ounces', 'ounce',
                            'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz','tsp', 'tsp', 'cup', 'pound']
        const units = [...unitsShort, 'kg', 'g']
        const newIngredients = this.ingredients.map(el => {
            // 1. Uniform units
            let ingredients = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredients = ingredients.replace(unit, unitsShort[i]);
            });

            //2. remove parentheses
            ingredients = ingredients.replace(/ *\([^)]*\) */g, ' ');

            //3. parse ingredients into count unit ingredient
            const arrIng = ingredients.split(' ');
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;
            if(unitIndex > -1) {
                //there is a unit
                //Ex. 4 1/2 cups, arrcount is [4, 1/2] --> eval("4+1/2") --> 4.5
                // EX. 4 cups, arrCount is [4]
                const arrCount = arrIng.slice(0, unitIndex);
                
                let count;
                if(arrCount.length === 1){
                    count = eval(arrIng[0].replace('-', '+'))
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                }

                objIng = {
                    count, //count: count
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                };

            } else if (parseInt(arrIng[0], 10)) {
                // there is no unit but the first element is number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ') //all the array except the first element

                }
            } else if(unitIndex === -1){
                //there is no unit and NO unit in 1st position
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient: ingredients
                }
            } 



            return objIng;
        });
        this.ingredients = newIngredients
    }

    updateServings(type) {
        //servings
        const newServings = type == 'dec' ? this.servings - 1 : this.servings + 1;

        // Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings)
        });

        this.servings = newServings
    }
}