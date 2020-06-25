// Data Module
var budgetController = (function () {
  var Expense = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function () {
    return this.percentage;
  };

  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function (type) {
    var sum = 0;    
    data.allItems[type].forEach(function (cur) {
      sum += cur.value;
    });
    data.totals[type] = sum;
  };

  var data = {
    allItems: {
      exp: [],
      inc: [],
    },
    totals: {
      exp: 0,
      inc: 0,
    },
    budget: 0,
    percentage: -1,
  };

  return {
    addItem: function (type, des, val) {
      var newItem, ID;

      // create new ID, ie. data.allItems[exp][getLastItem].id + 1
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }
      //create new item based on 'inc' or 'exp' type
      if (type === "exp") {
        // type will be the value of the <select class="Add__Type">
        newItem = new Expense(ID, des, val);
      } else if (type === "inc") {
        newItem = new Income(ID, des, val);
      }
      //seeing as type will be exp or inc we can add to the array either exp or inc in the allItems object and push into that array
      //add item into datastructure
      data.allItems[type].push(newItem);
      //return the newly created item (Expense or Income)
      return newItem;
    },
    deleteItem: function (type, id) {
      var ids, index;
      // map will return a new array populated with the results of calling a provided function on every element in the calling array.
      ids = data.allItems[type].map(function (val, index, arr) {
        return val.id; //the new array will just contain the ids of all items
      });

      //get the index of the id so we can delete that element of the array
      index = ids.indexOf(id); // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf

      if (index !== -1) {
        data.allItems[type].splice(index, 1); //delete one element out of our array at position index
      }
    },
    calculateBudget: function () {
      // calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");
      // calculate the budget : income - expenses
      data.budget = data.totals.inc - data.totals.exp;
      // caclulate the percentage of income that we spent
      // also ensure that inc is more than 0 to stop infinity printing if there are no incomes yet
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },
    calculatePercentages: function () {
      data.allItems.exp.forEach(function (val) {
        val.calcPercentage(data.totals.inc);
      });
    },
    getPercentages: function () {
      var allPercentages = data.allItems.exp.map(function (cur) {
        return cur.getPercentage();
      });
      return allPercentages;
    },
    getBudget: function () {
      //return an object so that we may return 4 values at once
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage,
      };
    },
    testing: function () {
      console.log(data);
    },
  };
})();

// Ui Module
var UIController = (function () {
  var DOMstrings = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expenseContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expenseLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    dateLabel: ".budget__title--month",
  };

  var formatNumber = function (num, type) {
    var numSplit, int, dec, sign;
    //+ or - before number. 2 decimal points, comma separating the thousands 2310.4567 -> 2310.46
    num = Math.abs(num);

    // NOTE : toFixed will return a string
    num = num.toFixed(2); //keep the decimal point to 2 figures if no decimal points exist, it will add .00

    // num at this point is a String!
    numSplit = num.split("."); // 255.35 now == [255, 35]
    int = numSplit[0];

    //int is still a string!
    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3); //if input == 2310, output = 2,310
    }

    dec = numSplit[1];
    type === "exp" ? (sign = "-") : (sign = "+");

    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      // the callback function will be called from here,
      // pasing the node item at the index(i) position of the loop
      // and pass the index(i)
      callback(list[i], i);
    }
  };

  return {
    getInput: function () {
      return {
        type: document.querySelector(DOMstrings.inputType).value, // will be either inc or exp as this is what is defined in the drop down lists options <select><option value="...">...</option></select>
        description: document.querySelector(DOMstrings.inputDescription).value, // will be the text inside the field added from the user
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
      };
    },
    addListItem: function (obj, type) {
      var html, newHtml, element;
      if (type === "inc") {
        element = DOMstrings.incomeContainer;
        html =
          '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">' +
          '%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>' +
          "</div></div></div>";
      } else if (type === "exp") {
        element = DOMstrings.expenseContainer;
        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div>' +
          '<div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div>' +
          '<div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>' +
          "</div></div></div>";
      }
      // Replace the placeholder text with some actual data
      // creates a new String replacing our tags that we wrapped with % signs with the data from our object (either income or expense)
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value));

      // Insert the html
      // 'beforeend' will add them html before the closing tag of the relevant DOM element.
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },
    deleteListItem: function (selectorID) {      
      var element = document.getElementById(selectorID);
      element.parentNode.removeChild(element);
    },
    clearFields: function () {
      var fields, fieldsArr;
      // get all inputs needed to be cleared
      fields = document.querySelectorAll(
        DOMstrings.inputDescription + ", " + DOMstrings.inputValue
      );
      // turn the NodeListOf<element> into a regular array
      fieldsArr = Array.prototype.slice.call(fields);
      // set the value of each item in the array to an empty string
      fieldsArr.forEach(function (current, index, array) {
        current.value = "";
      });
    },
    displayBudget: function (obj) {
      var type;
      obj.budget > 0 ? (type = "inc") : (type = "exp");

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(
        obj.totalInc,
        "inc"
      );
      document.querySelector(
        DOMstrings.expenseLabel
      ).textContent = formatNumber(obj.totalExp, "exp");
      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = "---";
      }
    },
    displayPercentages: function (percentages) {
      var fields;
      fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

      // pass the expensesPercentLabels node list as well as the expecting callback function
      nodeListForEach(fields, function (current, index) {
        // when this function is 'called back' the 'current node' will be passed in as well as the index
        // set the text content of the current node to the percentage at the given index in the percentages array
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      });
    },
    displayMonth: function () {
      var now, year, month, months;
      now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      months = [
        "January",
        "Febuary",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      document.querySelector(DOMstrings.dateLabel).textContent =
        months[month] + " " + year;
    },
    changedType: function () {
      var fields;
      fields = document.querySelectorAll(
        DOMstrings.inputType +
          "," +
          DOMstrings.inputDescription +
          "," +
          DOMstrings.inputValue
      );
      nodeListForEach(fields, function(cur) {
        cur.classList.toggle('red-focus');
      });
      document.querySelector(DOMstrings.inputBtn).classList.toggle('red');      
    },
    getDOMstrings: () => {
      // arrow function to make the DOMstrings accessible to the public
      return DOMstrings;
    },
  };
})();

//Controller Module
var controller = (function (UICtrl, budgetCtrl) {
  var setupEventListeners = function () {
    // moved the event listeners into a function to tidy up our code.

    var DOM = UICtrl.getDOMstrings(); // get the domstrings from the UIController that is passed in.
    
    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    // NOTE: add the event listener to the global document 
    // keydown will pass the keycode to the event handler. ie a == 65
    document.addEventListener("keydown", function (event) {
      // only fire code if the enter key (13) is pressed /* event.which is legacy code */
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    // When any element inside of the 'container' is clicked this Event handler will call the callback function
    // declared below
    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);

    document
      .querySelector(DOM.inputType)
      .addEventListener("change", UICtrl.changedType);
  };

  var updateBudget = function () {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();
    // 2. Return the budget
    var budget = budgetCtrl.getBudget();
    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function () {
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  };

  var ctrlAddItem = function () {
    var input, newItem;
    // 1. Get the field input data
    input = UICtrl.getInput();

    if (input.Description !== "" && !isNaN(input.value) && input.value > 0) {
      console.log(input);
      // 2. Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
      // 3. Add the item to the UI
      UICtrl.addListItem(newItem, input.type);
      //3.5 Clear fields
      UICtrl.clearFields();
      // 4. Calculate and update budget
      updateBudget();
      // 6. Calculate and update percentages
      updatePercentages();
    }
  };

  // event will passed via the addEventListener to this callback
  var ctrlDeleteItem = function (event) {    
    // when the close button is clicked we don't just want to delete the button itself but the whole expense
    // item / row. therefor we must use DOM traversing to get the parent element which holds all the data in that
    // specific row. Name, Amount, Delete Button. using event.target.parentNode, (target: gets the Target Element of the event)
    // we can then append .id to get the id property of the element that we need.
    var itemID, splitID, parentElement, type, ID;

    // very rigid
    for (var i = 0; i < 4; i++) {
      if (i === 0) parentElement = event.target.parentNode;
      else {
        parentElement = parentElement.parentNode;
      }
    }
    itemID = parentElement.id;    
    if (itemID) {
      //splits a string into an array so if our id is inc-5 the first element will be 'inc' and the second element will '5'
      splitID = itemID.split("-");
      type = splitID[0]; //inc or exp
      ID = parseInt(splitID[1]);

      // 1. delete item from data structure
      budgetCtrl.deleteItem(type, ID);
      // 2. delete the item from the UI
      UICtrl.deleteListItem(itemID); //pass the whole id to the delete method ie. inc-5
      // 3. update and show the new budget
      updateBudget();
      // 4. Calculate and update percentages
      updatePercentages();
    }
  };

  return {
    // created the init function so that we can run the private functions inside of this iife that are
    // needed for this  application to operate.
    init: function () {
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0,
      });
      setupEventListeners();
      UICtrl.displayMonth();
    },
  };
})(UIController, budgetController); // pass in the other modules into the iife

controller.init(); // initialize the application
