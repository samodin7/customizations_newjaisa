frappe.ui.form.on('Warehouse', {
    onload: function(frm) {
        const isGroup = frm.doc.is_group === 1;
        console.log("Is Group: ", isGroup);

        if (isGroup) {
            frm.set_df_property('max_capacity', 'hidden', 1);
            frm.set_df_property('available_capacity', 'hidden', 1);
        }

        if (!isGroup) {
            frappe.db.get_list('Stock Ledger Entry', {
                filters: {
                    warehouse: cur_frm.doc.name
                },
                fields: ['name', 'item_code', 'qty_after_transaction'],
                order_by: 'posting_date desc, posting_time desc',
                limit: 1
            }).then(function(result) {
                if (result && result.length > 0) {
                    console.log(result);
                    var qtyAfterTransaction = result[0].qty_after_transaction;

                    // Set the item code to the qty_after_transaction field
                    frm.set_value('qty_after_transaction', qtyAfterTransaction);
                    frm.refresh_field('qty_after_transaction');
                    console.log('qty_after_transaction', qtyAfterTransaction);

                    // Retrieve the max_capacity value from the Warehouse document
                    frappe.db.get_value('Warehouse', cur_frm.doc.name, 'max_capacity')
                        .then(function(res) {
                            var maxCapacity = res.message.max_capacity;
                            var availableCapacity = maxCapacity - qtyAfterTransaction;

                            // Set the available_capacity field
                            frm.set_value('available_capacity', availableCapacity);
                            frm.refresh_field('available_capacity');

                            // Save the form after relevant fields are updated
                            frm.save();
                        })
                        .catch(function(err) {
                            console.log('Error retrieving Max Capacity:', err);
                        });
                } else {
                    // Stock ledger data is not found, set available_capacity to max_capacity
                    frappe.db.get_value('Warehouse', cur_frm.doc.name, 'max_capacity')
                        .then(function(res) {
                            var maxCapacity = res.message.max_capacity;

                            // Set the available_capacity field to max_capacity
                            frm.set_value('available_capacity', maxCapacity);
                            frm.refresh_field('available_capacity');

                            // Save the form after relevant fields are updated
                            frm.save();
                        })
                        .catch(function(err) {
                            console.log('Error retrieving Max Capacity:', err);
                        });
                }
            }).catch(function(err) {
                console.log(err);
            });
        }
    }
});
