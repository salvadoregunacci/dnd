// =========================
// Variables
// =========================

const $dnd = document.querySelector('.dnd');
const $dndUploadImg = document.querySelector('.dnd__upload_images');
const $loadForm = document.getElementById('dnd__form');
const $submitBtn = document.querySelector('.dnd__submit_btn');
const $fileInput = document.getElementById('dnd__file_input')
const _uploadFiles = [];

// =========================
// Events
// =========================

if ($submitBtn) {
  $submitBtn.addEventListener("click", submitForm);
}

if ($dnd) {
  $dnd.addEventListener("dragenter", (e) => {
    e.preventDefault();
    $dnd.classList.add("active");
  });

  $dnd.addEventListener("dragleave", (e) => {
    e.preventDefault();
    $dnd.classList.remove("active");
  });

  $dnd.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  $dnd.addEventListener("drop", (e) => {
    e.preventDefault();

    const _file = e.dataTransfer.files[0];
    let _fileUrl = "";

    console.log(_file.type);

    if (_file.type.startsWith("image/")) {
      _fileUrl = URL.createObjectURL(_file);

      const uploadItem = document.createElement("div");
      uploadItem.classList.add("dnd__upload_img");
      uploadItem.innerHTML = `
        <div class="dnd__upload_img">
            <div class="dnd__upload_img_wrap">
                <img src="${_fileUrl}" alt="upload image">
                <button class="dnd__upload_img_delete_btn" title="удалить">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path
                            d="m432 32h-120l-9.4-18.7a24 24 0 0 0 -21.5-13.3h-114.3a23.72 23.72 0 0 0 -21.4 13.3l-9.4 18.7h-120a16 16 0 0 0 -16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0 -16-16zm-378.8 435a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45l21.2-339h-384z" />
                    </svg>
                </button>
            </div>
            <div class="dnd__upload_img_title">${_file.name}</div>
        </div>
      `;

      if ($dndUploadImg) {
        $dndUploadImg.append(uploadItem);

        $dnd.classList.remove("active");
        $dnd.classList.add("complete");

        _uploadFiles.push(_file);
        $submitBtn.removeAttribute("hidden");

        const deleteBtn = document.querySelector('.dnd__upload_img_delete_btn');

        deleteBtn.addEventListener("click", removeUploadImage);
      }
    } else {
      $dnd.classList.add("err");
      $dnd.classList.remove("active");

      setTimeout(()=> {
        $dnd.classList.remove("err");
      }, 3000);
    }
  });
}

// =========================
// Functions
// =========================

function removeUploadImage(e) {
  const curImg = e.target.closest(".dnd__upload_img");
  curImg.remove();
  _uploadFiles.pop();

  if($dnd &&_uploadFiles.length <= 0 && $submitBtn) {
    $dnd.classList.remove("complete");
    $submitBtn.setAttribute("hidden", "");
  }
}

function submitForm() {
  const dt = new DataTransfer();
  dt.items.add(_uploadFiles[0]);

  const fileList = dt.files;

  if ($fileInput) {
    $fileInput.files = fileList;
  }

  $loadForm.submit();
}

class DND {
  constructor(options) {
    this._options = {
      multiple: false,
      validTypes: "*",
      uiStyle: "default"
    }
  }
}