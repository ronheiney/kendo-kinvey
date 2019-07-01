import Vue from 'vue'
import Vuex from 'vuex'
const kinvey = require('kinvey-html5-sdk');
import customers from '../assets/customers'

Vue.use(Vuex)

kinvey.init({
    appKey: "kid_S1etDRC1S",
    appSecret: "312e23ff641c421a8e0f6a1f195d2b68"
});

  export default new Vuex.Store({
    state: {
        customers: JSON.parse(JSON.stringify(customers)),
        activeUser: null,
        isConnected: false,
        DataStoreType: kinvey.DataStoreType
    },
    getters: {
        titles: state => {
            var allTitles = state.customers.map((item) => {
                return item.ContactTitle
            })

            return allTitles.filter((value, index, self) => {
                return self.indexOf(value) === index;
            })
        },
        customerIds: state => {
            return state.customers.map((item) => {
                return item.CustomerID
            })
        }
    },
    mutations: {
        edit (state, customer) {
            var foundCustomer = state.customers.find((cust) => {
                return cust.CustomerID === customer.CustomerID
            })

            var index = state.customers.indexOf(foundCustomer)

            state.customers[index] = customer
        },
        add (state, customer) {
            state.customers = [...state.customers, customer]
        },
        remove (state, index) {
            state.customers.splice(index, 1)
        },        
        loadJson (state, customersJson) {
            state.customers = JSON.parse(customersJson)
        },
        load (state, customers) {
            state.customers = customers
        },
        reset (state) {
            state.customers = JSON.parse(JSON.stringify(customers))
        }
    },
    actions: {
        add (context, customer) {
            return new Promise((resolve, reject) => {
                if (context.getters.customerIds.indexOf(customer.CustomerID) > -1) {
                    reject('This Customer ID exists!')
                } else if (customer.CustomerID === '') {
                    reject('Customer ID cannot be empty!')
                } else {
                    const dataStore = kinvey.DataStore.collection('customers')
                    dataStore.save(customer).then(() => {
                        context.commit('add', customer)
                        dataStore.sync()
                        resolve(context.getters.customerIds.indexOf(customer.CustomerID))
                    })
                }
            })
        },
        remove (context, customer) {
            return new Promise((resolve, reject) => {
                const foundCustomer = context.state.customers.find((cust) => {
                    return cust.CustomerID === customer.CustomerID
                })

                const index = context.state.customers.indexOf(foundCustomer)

                if (!customer || index < 0) {
                    reject('Customer not found!')
                } else {
                    const dataStore = kinvey.DataStore.collection('customers')
                    dataStore.removeById(customer._id).then(() => {
                        context.commit('remove', index)
                        dataStore.sync()
                        resolve(Object.assign({}, foundCustomer))
                    })
                }
            })
        },
        get (context) {
            const dataStore = kinvey.DataStore.collection('customers')
            this.activeUser = kinvey.User.getActiveUser();

            if (!this.activeUser) {
                var that = this;
                console.log('signing up');
                kinvey.User.signup()
                    .then(function(user) {
                        that.activeUser = user;
                        that.isConnected = true;
                        dataStore
                        .find()
                        .subscribe(customers => {
                            context.commit('load', customers)
                        })
                    }).catch(function(error) {
                        console.log(error);
                    });
            }
            else {
                console.log('user exists');
                this.isConnected = true;
                dataStore
                .find()
                .subscribe(customers => {
                    context.commit('load', customers)
                })
            }
        }
    }
})