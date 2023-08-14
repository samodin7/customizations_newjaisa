import frappe
import random
from base64 import b64encode
from io import BytesIO
from datetime import date
#new_module_path = 'home/frappe/.local/lib/python3.8/site-packages/qrcode'
#sys.path.append(new_module_path)
#import new_module_path
import qrcode
from frappe import get_doc
from frappe.model.document import Document

@frappe.whitelist()
def cancelled_data(comment, reason, user):
    new_doc = frappe.new_doc('Deviation History')
    new_doc.user = user
    new_doc.activity_type = "Document Cancellation"
    new_doc.reason = reason
    new_doc.comment = comment
    new_doc.save()

@frappe.whitelist()
def test_api(item_code,serial_no):
    exists = frappe.db.exists('Serial No', serial_no)
    if exists:
        frappe.throw("Serial No alredy exist : "+ serial_no)
    else:
        max_cop = frappe.get_value('Item', {'name': item_code}, 'maximum_copy')
        length_doc = frappe.get_value('Item', {'name': item_code}, 'width')
        height_doc = frappe.get_value('Item', {'name': item_code}, 'width')

    
@frappe.whitelist()
def create_serial_no(item_code):
    new_serial = generate_random_code()
    return new_serial

def generate_random_code():
    prefix = "NJ"
    random_code = prefix + str(random.randint(100000, 999999))
    return random_code

@frappe.whitelist()
def create_reason_copy(serial_no, item_code, name, copies,reason, comment):
    #max_cop = frappe.get_value('Item', {'name': item_code}, 'maximum_copy')
    #if float(copies) > float(max_cop):
        #reason = frappe.get_prompt("Select the Reason", "reason", fieldtype="Link", options="cancel Reason")
        # comment = frappe.get_prompt("comment: ")
    new_doc = frappe.new_doc("Deviation History")
    new_doc.user = frappe.session.user
    new_doc.reason = reason
    new_doc.comment = comment
    new_doc.serial_no = serial_no
    new_doc.item_code = item_code
    new_doc.referance_doctype = "Stock Entry"
    new_doc.document_name = name
    new_doc.save()
    return new_doc.name

@frappe.whitelist()
def print_api(serial_no):
    new_code = get_qr_code(serial_no)
    frappe.set_value("Serial No",serial_no, "qr_code",new_code)
    output= "QR updated in serial number"+" "+serial_no
    return output

@frappe.whitelist()
def get_max_cop(item_code,print_cpy,serial_no):
        group = frappe.get_value('Item', {'name': item_code}, 'item_group')
        #item_group = frappe.get_value('Item Group', {'name': group}, 'item_group')
        width = frappe.get_value('Item Group', {'name': group}, 'width')
        height = frappe.get_value('Item Group', {'name': group}, 'height')
        max_cop = frappe.get_value('Item Group', {'name': group}, 'maximum_copy')
        print_format = frappe.get_value('Item Group', {'name': group}, 'print_format')
        doc = frappe.get_doc("Serial No", serial_no)
        doc.last_qr_count = int(print_cpy)
        doc.save()
        return max_cop,width,height,print_format


@frappe.whitelist()
def get_qr_code(data: str) -> str:
	qr_code_bytes = get_qr_code_bytes(data, format="PNG")
	base_64_string = bytes_to_base64_string(qr_code_bytes)

	return add_file_info(base_64_string)


def add_file_info(data: str) -> str:
	"""Add info about the file type and encoding.
	
	This is required so the browser can make sense of the data."""
	return f"data:image/png;base64, {data}"


def get_qr_code_bytes(data, format: str) -> bytes:
	"""Create a QR code and return the bytes."""
	img = qrcode.make(data)

	buffered = BytesIO()
	img.save(buffered, format="PNG")

	return buffered.getvalue()


def bytes_to_base64_string(data: bytes) -> str:
	"""Convert bytes to a base64 encoded string."""
	return b64encode(data).decode("utf-8")

@frappe.whitelist()
def get_item_qc(parent_group):
    group_data = []
    item_groups = frappe.get_all("Item Group", filters={'parent_item_group': parent_group}, fields=['name'])
    
    for item_group in item_groups:
        group_name = item_group.name
        quality_check_list = frappe.get_all("Quality Check List", filters={'parent': group_name}, fields=['name'])

        group_data.append({
            'name': group_name,
            'quality_check_list': quality_check_list
        })
    
    return group_data

@frappe.whitelist()
def get_item_groups(parent_group):
    group_data = []
    item_groups = frappe.get_all("Item Group", filters={'parent_item_group': parent_group}, fields=['name'])
    for item_group in item_groups:
        group_data.append(item_group.name)
    return group_data

#@frappe.whitelist()
#def warrenty_on_item(serial_no):
#    current_date = date.today()
#    serial_warenty_date = frappe.get_value("Serial No",serial_no, "warranty_date")
#    if serial_warenty_date:
#        if current_date >= serial_warenty_date:
#            return "is Under Warrenty"
@frappe.whitelist()
def warrenty_on_item(serial_no):
    current_date = date.today()
    serial_warenty_date = frappe.get_value("Serial No",serial_no, "warranty_date")
    if serial_warenty_date:
        if current_date >= serial_warenty_date:
            return "is Under Warrenty"


@frappe.whitelist()
def get_serial_details(serial_no):
     source_ware = frappe.get_value('Serial No', {'name': serial_no}, 'warehouse')
     brand = frappe.get_value('Serial No', {'name': serial_no}, 'brand')
     item_code = frappe.get_value('Serial No', {'name': serial_no}, 'item_code')
     item_group = frappe.get_value('Item', {'name': item_code}, 'item_group')
     return source_ware, brand, item_code, item_group

@frappe.whitelist()
def get_t_ava(warehouse):
    try:
        # Fetch available capacity
        available_capacity = frappe.get_value("Warehouse", warehouse, "available_capacity")
        return available_capacity
    except frappe.DoesNotExistError:
	    return None
	    
# <<<<<<< HEAD
#         return None
# =======
#         return None
# >>>>>>> 9399b41544db1a69b75e0ae3e25cf4bfe3e33db7
