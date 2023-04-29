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
      $el: null,
      $elWrap: null,
      $elInnerTitle: null,
      $elAlert: null,
      $loadedImagesWrap: null,
      $submitForm: null,
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
      allowedTypes: options.allowedTypes || "*",
      uiStyle: options.uiStyle || "default"
    };

    this.__ = {
      btnSaveTxt: "Сохранить",
      title: {
        default: "Перетащите файлы сюда",
        drop: "Отпустите файл",
      },
      alertTxt: {
        onlyPhoto: "Можно загрузить только фото"
      },
      err: {
        default: "Произошла ошибка",
        fileTypeNotAllowed: "Выберите фото",
        fileTypeNotSupported: `Формат файла не подходит, только: "${Array.from(this._options.allowedTypes).join(",")}"`
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
    this.dom.$elWrap.addEventListener("dragenter", this._eHandlers.dragenter);
    this.dom.$elWrap.addEventListener("dragleave", this._eHandlers.dragleave);
    this.dom.$elWrap.addEventListener("dragover", this._eHandlers.dragover);
    this.dom.$elWrap.addEventListener("drop", this._eHandlers.drop);
  }

  // event handlers  ======

  // enter
  _dragEnterHandler(e) {
    e.preventDefault();
    this._changeState("active");
  }

  // leave
  _dragLeaveHandler(e) {
    e.preventDefault();
    this._changeState("default");
  }

  // over
  _dragOverHandler(e) {
    e.preventDefault();
  }

  // drop
  _dragDropHandler(e) {
    e.preventDefault();

    const _file = e.dataTransfer.files[0];

    const _resultCheckFile = this._checkAllowedFile(_file);

    if (_resultCheckFile.status) {
      console.log("все ок");
    } else {
      this._showAlert(_resultCheckFile.errMsg || this.__.err.default, _resultCheckFile.errType);
      this._changeState("default");
    }
  }
  // # event handlers ======


  _initToDOM() {
    this.dom.$el = this._wrap.querySelector('.dnd');
    this.dom.$elWrap = this._wrap.querySelector('.dnd__wrap');
    this.dom.$elInnerTitle = this._wrap.querySelector('.dnd__title');
    this.dom.$elAlert = this._wrap.querySelector('.dnd__alert');
    this.dom.$loadedImagesWrap = this._wrap.querySelector('.dnd__upload_images');
    this.dom.$submitForm = this._wrap.querySelector('.dnd__form');
    this.dom.$submitBtn = this._wrap.querySelector('.dnd__submit_btn');
    this.dom.$fileInput = this._wrap.querySelector('.dnd__file_input');

    for (const key in this.dom) {
      if (Object.hasOwnProperty.call(this.dom, key)) {
        const el = this.dom[key];

        if (el === null) throw new Error(`required DOM element not found | element: ${key}`);
      }
    }
  }


  _checkAllowedFile(file) {
    try {
      if (file instanceof File) {

        if (typeof (this._options.allowedTypes) === "string") {
          if (this._options.allowedTypes === "*" && file.type.startsWith("image/")) {
            return { status: true };
          }

          return { errType: "danger", errMsg: this.__.err.fileTypeNotAllowed, status: false };
        } else if (Array.isArray(this._options.allowedTypes)) {

          if (!file.type.startsWith("image/")) return { errType: "danger", errMsg: this.__.err.fileTypeNotAllowed, status: false };

          const _type = file.type.replace(/^image\//, "");
          return this._options.allowedTypes.includes(_type) ? { status: true } : { errType: "warning", errMsg: this.__.err.fileTypeNotSupported, status: false };
        }

      } else {
        throw new Error("uploaded object is not a file");
      }
    } catch (err) {
      console.error(err.message);
    }
  }


  _getHtml() {
    return `
    <div class="dnd" data-ui-style="${this._options.uiStyle}">
      <div class="dnd__wrap">
          <span class="dnd__title">${this.__.title.default}</span>
          <div class="dnd__alert" data-type="warning">${this.__.alertTxt.onlyPhoto}</div>

          <div class="dnd__upload_images"></div>
      </div>

      <button hidden class="dnd__submit_btn">${this.__.btnSaveTxt}</button>

      <form hidden class="dnd__form" action="${this._options.actionPath}" method="POST" enctype="multipart/form-data">
          <input type="file" name="img" class="dnd__file_input">
      </form>
    </div>
    `;
  }


  // helpers   =========
  _changeTitle(newTxt = this.__.title.default) {
    this.dom.$elInnerTitle.textContent = newTxt;
  }

  _showAlert(msg = "", type = "warning", timeToShow = 3000) {
    this.dom.$elAlert.textContent = msg;
    this.dom.$elAlert.setAttribute("data-type", type);
    this.dom.$elAlert.style.display = "block";

    setTimeout(() => this.dom.$elAlert.style.display = "none", timeToShow);
  }

  _changeState(state) {
    switch (state) {
      case "active":
        this._changeTitle(this.__.title.drop);
        this.dom.$el.classList.add("active");
        break;
      case "default":
      default:
        this._changeTitle(this.__.title.default);
        this.dom.$el.classList.remove("active");
    }
  }
  // #helpers  =========
}


const dragNdrop = new DND(".dragdrop", {
  actionPath: "heheheh",
  allowedTypes: ["png", "webp"]
});