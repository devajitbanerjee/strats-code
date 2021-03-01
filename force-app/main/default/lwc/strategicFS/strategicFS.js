import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//import fetchDataHelper from './fetchDataHelper';
import jsonData from '@salesforce/resourceUrl/data';

const columns = [
    { label: 'Creditor', fieldName: 'creditorName', type: 'text'},
    { label: 'First Name', fieldName: 'firstName', type: 'text'},
    { label: 'Last Name', fieldName: 'lastName', type: 'text'},
    { label: 'Min Pay %', fieldName: 'minPaymentPercentage', type: 'number',
        typeAttributes: { 
            minimumFractionDigits: '2', maximumFractionDigits: '2'
        }
    },
    { label: 'Balance', fieldName: 'balance', type: 'number',
        typeAttributes: { 
            minimumFractionDigits: '2', maximumFractionDigits: '2'
        }
    },
];

export default class BasicDatatable extends LightningElement {
    // Exposed data elements on the page
    @track totalBalance = 0;
    @track data = [];
    @track showInputSection = false;
    // Non tracked variables 
    selectedData = []; 
    lastID = 0;
    columns = columns;
    // Initial data fetch - asynchronous (ain't nothing holding the page back while it loads)
    async connectedCallback() {
        let request = new XMLHttpRequest();
        request.open('GET', jsonData, false);
        request.send(null);
        this.data = JSON.parse(request.responseText);
        // turns out that github does not provide 
        // unauthenticated access to public repos over rest
        // Thank you github. Hence cannot fatch Data using the Fetch API 
        //const data = await fetchDataHelper({ amountOfRecords: 100 });
        //this.data = data;
        this.calculateData();
    }
    // Event Handler for "Add Debt" onclick
    handleAddRow(event) {
        this.showInputSection = true;
    }
    // Event Handler for "Remove Debt" onclick
    handleRemoveRow(event) {
        // For some reason lwc returns a proxy and not an object array when
        // accessing seslectedData directly so going to have to do a query 
        // selection for elements to fetch selected rows
        //let selectedRows = this.selectedData;
        let selectedRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        if(!selectedRows.length) {
            this.showNotification('No Rows Selected');
            return;
        }
        for(let i = 0; i < selectedRows.length; i++) {
            for(let j = 0; j < this.data.length; j++) {
                if(this.data[j]['id'] == selectedRows[i]['id']) {
                    this.data.splice(j,1);
                }
            } 
        }
        this.calculateData();
    }
    // Event Handler for "Save" onclick
    handleSaveRow(event) {
        // Run all validations since it is run from a non form submit button
        // and may skip validation component validation rules
        const checkAllField = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        if (checkAllField) {
            let newRow = {};
            newRow.id = this.lastID + 1;
            // could have been smiplified by using same DOM name as object schema but 
            // may incur heavy price if overlooked
            this.template.querySelectorAll('lightning-input').forEach(function(element){
                if(element.name == 'creditorInput')
                    newRow.creditorName = element.value;
                else if(element.name == 'firstNameInput')
                    newRow.firstName = element.value;
                else if(element.name == 'lastNameInput')
                    newRow.lastName = element.value;
                else if(element.name == 'minPayInput')
                    newRow.minPaymentPercentage = element.value;
                else if(element.name == 'balanceInput')
                    newRow.balance = element.value;   
            },this);
            this.data.push(newRow);
            this.showInputSection = false;
            this.calculateData();
        } else {
            this.showNotification('Please verify fields');
            return;
        }
    }
    // Event Handler for "Cancel" onclick
    handleCancelRow(event) {
        this.showInputSection = false;
    }
    // Event Handler for "lightning-datatable" onSelect
    handleRowSelection(event) {
        this.selectedData = this.template.querySelector('lightning-datatable').getSelectedRows();
    }
    // Reused Code to refersh table data as well as balance total
    calculateData() {
        let calculatedBalance = 0;
        // lwc does not track changes in an array but only when the object reference changes (weird)
        // hence JSON - string - JSON conversion to generate new object instance
        this.data = JSON.parse(JSON.stringify(this.data));
        for(let i = 0; i < this.data.length; i++) {
            calculatedBalance = Number(calculatedBalance) + Number(this.data[i]['balance']);
            if(Number(this.data[i]['id']) > this.lastID) {
                // ensures that the Id is never repeated
                this.lastID = this.data[i]['id']
            }
        }
        this.totalBalance = calculatedBalance;
    }
    // Reusable method to trigger a Toast notification event
    // currently only generates error notifications with configurable message
    showNotification(message) {
        const evt = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error',
            mode: 'dismissable',
        });
        this.dispatchEvent(evt);
    }
}