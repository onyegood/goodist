Let's say I have two Schema objects, employeeSchema and leaveSchema as shown in the steps below.

Step 1

//Employee Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const employeeSchema = new Schema({
  firstName: {
    type: String,
    required: true
  }
  lastName: {
    type: String,
    required: true
  },
  leave: [{
    type: Schema.Types.ObjectId,
    ref: 'Leave',
    required: true
  }]
  resetToken: String,
  resetTokenExpiration: Date
}, { timestamps: true });
module.exports = mongoose.model('Employee', employeeSchema);

//Leave Schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const leaveSchema = new Schema({
  startDate: {
    type: Date,
    required: true
  }
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
	enum: ['annual','sick']
    required: true
  },
  employee: {
    type: mongoose.Types.ObjectId,
    ref: 'Employee',
 	required: true
  }
}, { timestamps: true });
module.exports = mongoose.model(‘Leave’, leaveSchema);


Step 2

Now that my schemas are ready.

Note: In my schemas above employee can request for leave as many times as possible, meaning one-to-many relationship in other words.

While a leave can only have one employee, in other words one-to-one relationship as the case may be.

So whenever an employee request for leave, I want to add that leave ID into the leave array in employeeSchema object above for that employee, and whenever he deletes that leave, I also want to remove it from his leave array. 

So here is where my library (goodist) come to play a big role. See code snippet.

First thing first install the library

npm i goodist.

Import it as shown below

const goodist = require(‘goodist’);

//To Create a Leave Request
exports.create = async (req, res, next) => {
  const errors = validationResult(req);
  const { startDate, endDate, comment, leavetype } = req.body;
  const employeeID = req.userId;
  try {
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }
    const leave = new Leave({
      startDate: startDate,
      endDate: endDate,
      leavetype: leavetype,
      employee: employeeID
    });

    await leave.save();

    // Add leave ID to employee leave array
    const employee = await Employee.findById(employeeID);
    goodist.pushOne(leave, employee.leave, employee);
    // Add leave ID to employee leave array


    res.status(201).json({
      success: true,
      message: 'Created successfully!',
      leave: leave
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

//To Delete Leave Request
exports.delete = async (req, res, next) => {
  const errors = validationResult(req);
  const id = req.params.id;
  const employeeID = req.userId;
  try {
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }
    const leave = await Leave.findById(id);
     
    if (!leave) {
      const error = new Error('Error fetching data');
      error.statusCode = 422;
      throw error;
    }
    if (employeeID.toString() !== leave.employee.toString()) {
      const error = new Error('Unauthorized!');
      error.statusCode = 401;
      throw error;
    }
    await Leave.findOneAndDelete(id);

    // Remove leave from employee leave array
	const employee = await Employee.findById(employeeID);
    goodist.pullOne(leave, employee.leave, employee);
    // Remove leave from employee leave array

    res.status(200).json({
      success: true,
      message: 'Deleted successfully!'
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}


goodist expose 4 helpful methods pushOne, pushMany, pullOne and pullMany.

i. pushOne to add one item in the array.

==Usage==
const employee = await Employee.findById(employeeID);
goodist.pushOne(leave, employee.leave, employee);

ii. pullOne to remove one item from the array.

==Usage==
const employee = await Employee.findById(employeeID);
goodist.pullOne(leave, employee.leave, employee);

iii. pushMany to add more than one items in the array at a time.

==Usage==
const employee = await Employee.findById(employeeID);
goodist.pushMany(leave, employee.leave, employee);

iv. pullMany to remove more than one items from the array at a time.

==Usage==
const employee = await Employee.findById(employeeID);
goodist.pullMany(leave, employee.leave, employee);

Note:
leave:- represent what you want to push. In my case it is the leave object

employee.leave:- Is an array, it represent where you push the item.

employee:- Is an object that house the array, which must be re-save after pushing.

When using pushOne and pullOne, the first parameter must be an object or string while pushMany and pullMany expect the first parameter to be an array.