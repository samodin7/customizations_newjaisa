frappe.ui.form.on('Stock Entry', {
	validate: function(frm) {
		var itemsToGenerateQRCode = [];
		
		for (let i = 0; i < cur_frm.doc.items.length; i++) {
			if (cur_frm.doc.items[i].serial_no) {
				var new_var = cur_frm.doc.items[i].serial_no;
				var new_list = new_var.split("\n");
				if (cur_frm.doc.items[i].qty > new_list.length) {
					var rest = cur_frm.doc.items[i].qty - new_list.length;
					
					// Add item to generate QR code
					itemsToGenerateQRCode.push({
						index: i,
						rest: rest,
						item_name: cur_frm.doc.items[i].item_name
					});
				}
			} else {
				var qty = cur_frm.doc.items[i].qty;
				
				// Add item to generate QR code
				itemsToGenerateQRCode.push({
					index: i,
					rest: qty,
					item_name: cur_frm.doc.items[i].item_name
				});
			}
		}
		
		// Process items to generate QR code
		processItemsToGenerateQRCode(itemsToGenerateQRCode);
	}
});

function processItemsToGenerateQRCode(itemsToGenerateQRCode) {
	if (itemsToGenerateQRCode.length === 0) {
		// No items to generate QR code, exit
		return;
	}
	
	var item = itemsToGenerateQRCode.shift();
	
	// Confirmation dialog
	frappe.confirm(
		"Generate QR code for item " + item.item_name + "?",
		function() {
			generateQRCodeForItem(item);
			processItemsToGenerateQRCode(itemsToGenerateQRCode);
		},
		function() {
			processItemsToGenerateQRCode(itemsToGenerateQRCode);
		}
	);
}

function generateQRCodeForItem(item) {
	if (cur_frm.doc.items[item.index].serial_no) {
		var new_var = cur_frm.doc.items[item.index].serial_no;
		var new_list = new_var.split("\n");
		var rest = item.rest;
		
		for (let k = 0; k < rest; k++) {
			console.log(k);
			frappe.call({
				method: 'customizations_newjaisa.api_files.create_serial_no',
				args: {
					item_code: cur_frm.doc.items[item.index].item_code,
				},
				callback: function(response) {
					var new_serialname = response.message;
					console.log(new_serialname + " " + cur_frm.doc.items[item.index].serial_no);
					if (cur_frm.doc.items[item.index].serial_no) {
						cur_frm.doc.items[item.index].serial_no += "\n" + new_serialname;
					} else {
						cur_frm.doc.items[item.index].serial_no = new_serialname;
					}
				}
			});
		}
	} else {
		var qty = cur_frm.doc.items[item.index].qty;
		
		for (let k = 0; k < qty; k++) {
			frappe.call({
				method: 'customizations_newjaisa.api_files.create_serial_no',
				args: {
					item_code: cur_frm.doc.items[item.index].item_code,
				},
				callback: function(response) {
					var new_serialname = response.message;
					console.log(new_serialname + " " + cur_frm.doc.items[item.index].serial_no);
					if (cur_frm.doc.items[item.index].serial_no) {
						cur_frm.doc.items[item.index].serial_no += "\n" + new_serialname;
					} else {
						cur_frm.doc.items[item.index].serial_no = new_serialname;
					}
				}
			});
		}
	}
}
frappe.ui.form.on('Stock Entry', {
    on_submit: function(frm) {
        console.log("submit");
        var new_list = [];

        for (let i = 0; i < cur_frm.doc.items.length; i++) {
            var new_var = cur_frm.doc.items[i].serial_no;
            new_list = new_var.split("\n");
            var mac_cop;
            for (let j = 0; j < new_list.length; j++) {
                console.log(new_list[j]);

                frappe.call({
                    method: "customizations_newjaisa.api_files.print_api",
                    args: {
                        serial_no: new_list[j],
                    },
                    callback: function(response) {
                        if (response.message) {
                            console.log(response);
                            var max_cop = response.message;
                            console.log("re");
                        } else {
                            console.log("not working");
                        }
                    }
                });
            }

            frappe.confirm(
                "QR Code for Serial Numbers " + new_list + " for Item: " + cur_frm.doc.items[i].item_code + ", will be Printed\n" + "proceed to Print Page",
                function() {
                    for (let j = 0; j < new_list.length; j++) {
                        var name = prompt("Please enter the number of copies required for Serial No " + new_list[j]);
                        if (name) {
                            var copy_rqd = name;
                            var res;
                            var com;
                            frappe.call({
                                method: "customizations_newjaisa.api_files.get_max_cop",
                                args: {
                                    item_code: cur_frm.doc.items[i].item_code,
                                    serial_no: new_list[j],
                                    print_cpy: name
                                },
                                callback: function(response) {
                                    if (response.message) {
                                        console.log(response);
                                        var max_cop = response.message[0];
                                        var weight = response.message[1];
                                        var height = response.message[2];
                                        var prf = response.message[3];
                                        console.log("re " + max_cop + " "+ name);


                                        if (name > max_cop) {
                                            console.log("testing sam")
                                            frappe.prompt([{
                                                    fieldname: 'reason',
                                                    label: 'Reason',
                                                    fieldtype: 'Link',
                                                    reqd: 1,
                                                    options: 'Master Reasons'
                                                },
                                                {
                                                    fieldname: 'comment',
                                                    label: 'Comment',
                                                    fieldtype: 'Small Text',
                                                    reqd: 1
                                                }
                                            ], function(values) {
                                                res = values.reason;
                                                com = values.comment;
                                                frappe.call({
                                                    method: "customizations_newjaisa.api_files.create_reason_copy",
                                                    args: {
                                                        item_code: cur_frm.doc.items[i].item_code,
                                                        serial_no: new_list[j],
                                                        name: cur_frm.doc.name,
                                                        copies: name,
                                                        reason: res,
                                                        comment: com
                                                    },
                                                    callback: function(response) {
                                                        if (response.message) {
                                                            console.log("reason Created")
                                                          var objWindowOpenResult = window.open(frappe.urllib.get_full_url("/printview?" +
                                                    "doctype=" + encodeURIComponent("Serial No") +
                                                    "&name=" + encodeURIComponent(new_list[j]) +
                                                    "&trigger_print=1" +
                                                    "&format=" + prf +
                                                    "&no_letterhead=1" +
                                                    "&width=" + weight +
                                                    "&height=" + height +
                                                    "&_lang=en" +
                                                    "&count=" + name
                                                  )); // end print link
                                                            
                                                        } else {
                                                            console.log("Not in document");

                                                            var objWindowOpenResult = window.open(frappe.urllib.get_full_url("/printview?" +
                                                    "doctype=" + encodeURIComponent("Serial No") +
                                                    "&name=" + encodeURIComponent(new_list[j]) +
                                                    "&trigger_print=1" +
                                                    "&format=" + prf +
                                                    "&no_letterhead=1" +
                                                    "&width=" + weight +
                                                    "&height=" + height +
                                                    "&_lang=en" +
                                                    "&count=" + name
                                                  )); // end print link
                                                        }
                                                    }
                                                });

                                            }, 'Excess Printing of QR Code detected for Serial NO : '+ new_list[j]);
                                        } else {
                                            var objWindowOpenResult = window.open(frappe.urllib.get_full_url("/printview?" +
                                                    "doctype=" + encodeURIComponent("Serial No") +
                                                    "&name=" + encodeURIComponent(new_list[j]) +
                                                    "&trigger_print=1" +
                                                    "&format=" + prf +
                                                    "&no_letterhead=1" +
                                                    "&width=" + weight +
                                                    "&height=" + height +
                                                    "&_lang=en" +
                                                    "&count=" + name
                                                  )); // end print link
                                        }
                                    }
                                }
                            });
                        } else {
                            frappe.throw(" QR Print has been cancelled");
                        }
                    }
                },
                function() {
                    // No button action
                    // Do nothing or handle the rejection case
                },
                'Confirmation',
                ['Print', 'No']
            );
        }
    }
});
frappe.ui.form.on('Stock Entry', {
     	refresh(frm) {
         	frm.set_query('t_warehouse', 'items', function(doc, cdt, cdn) {
                 var d = locals[cdt][cdn];
                 return {
                     "filters": {
                     	"company":"NewJaisa"
                     }
                 };
             });
     	}
     });
