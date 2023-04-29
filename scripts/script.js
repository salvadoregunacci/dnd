// =========================
// Variables
// =========================

const $dnd = document.querySelector('.dnd');
const $dndWrap = document.querySelector('.dnd__wrap');
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

if ($dnd && $dndWrap) {
  $dndWrap.addEventListener("dragenter", (e) => {
    e.preventDefault();
    $dnd.classList.add("active");
  });

  $dndWrap.addEventListener("dragleave", (e) => {
    e.preventDefault();
    $dnd.classList.remove("active");
  });

  $dndWrap.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  $dndWrap.addEventListener("drop", (e) => {
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

      setTimeout(() => {
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

  if ($dndWrap && _uploadFiles.length <= 0 && $submitBtn) {
    $dndWrap.classList.remove("complete");
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

// ===============================================
// ===============================================
// ===============================================
// ===============================================
// ===============================================
// ===============================================

class DND {
  constructor(createEl = ".dnd_el", options) {

    this._uploadFiles = [];
    this.dom = {
      $dnd: null,
      $dndWrap: null,
      $dndUploadImg: null,
      $loadForm: null,
      $submitBtn: null,
      $fileInput: null,
    };

    this._eHandlers = {
      dragenter: this._dragEnterHandler.bind(this),
      dragleave: this._dragLeaveHandler.bind(this),
      dragover: this._dragOverHandler.bind(this),
      drop: this._dragDropHandler.bind(this)
    };

    this._options = {
      actionPath: options.actionPath || "#",
      multiple: options.multiple || false,
      validTypes: options.validTypes || "*",
      uiStyle: options.uiStyle || "default"
    };

    this.__ = {
      btnSaveTxt: "Сохранить",
      defaultTitle: "Перетащите файлы сюда",
      dropTitle: "Отпустите файл",
      alertTxt: {
        onlyPhoto: "Можно загрузить только фото!"
      }
    };

    this._init(createEl);
  }


  _init(createEl) {
    try {
      this._wrap = document.querySelector(createEl);

      if (!this._wrap) {
        throw new Error("Container element not found");
      }

      this._addToDOM();
      this._initToDOM();
      this._addEventHandlers();
    } catch (err) {
      console.error(err.message);
    }
  }


  _addToDOM() {
    this._wrap.innerHTML = this._getHtml();
  }


  _addEventHandlers() {
    this.dom.$dndWrap.addEventListener("dragenter", this._eHandlers.dragenter);
    this.dom.$dndWrap.addEventListener("dragleaver", this._eHandlers.dragleave);
    this.dom.$dndWrap.addEventListener("dragover", this._eHandlers.dragover);
    this.dom.$dndWrap.addEventListener("drop", this._eHandlers.drop);
  }

  // event handlers
  _dragEnterHandler(e) {
    e.preventDefault();
    console.log(this);
    this.dom.$dnd.classList.add("active");
    // console.log("enter");
  }

  _dragLeaveHandler(e) {
    e.preventDefault();
    this.dom.$dnd.classList.remove("active");
    // console.log("leave");
  }

  _dragOverHandler(e) {
    e.preventDefault();
    // console.log("over");
  }

  _dragDropHandler(e) {
    e.preventDefault();
    // console.log("drop");
  }
  // # event handlers


  _initToDOM() {
    this.dom.$dnd = this._wrap.querySelector('.dnd');
    this.dom.$dndWrap = this._wrap.querySelector('.dnd__wrap');
    this.dom.$dndUploadImg = this._wrap.querySelector('.dnd__upload_images');
    this.dom.$loadForm = this._wrap.querySelector('.dnd__form');
    this.dom.$submitBtn = this._wrap.querySelector('.dnd__submit_btn');
    this.dom.$fileInput = this._wrap.querySelector('.dnd__file_input');

    for (const key in this.dom) {
      if (Object.hasOwnProperty.call(this.dom, key)) {
        const el = this.dom[key];

        if (el === null) throw new Error(`required DOM element not found | element: ${key}`);
      }
    }
  }


  _getHtml() {
    return `
    <div class="dnd" data-ui-style="${this._options.uiStyle}">
      <div class="dnd__wrap">
          <span class="dnd__title dnd__title_enter">${this.__.defaultTitle}</span>
          <span class="dnd__title dnd__title_drop">${this.__.dropTitle}</span>
          <div class="dnd__alert">${this.__.alertTxt.onlyPhoto}</div>

          <div class="dnd__upload_images"></div>
      </div>

      <button hidden class="dnd__submit_btn">${this.__.btnSaveTxt}</button>

      <form hidden class="dnd__form" action="${this._options.actionPath}" method="POST" enctype="multipart/form-data">
          <input type="file" name="img" class="dnd__file_input">
      </form>
    </div>
    `;
  }
}


const dragNdrop = new DND(".dragdrop", {
  actionPath: "heheheh"
});