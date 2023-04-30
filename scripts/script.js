class DND {
  constructor(createWrap = ".dnd_el", options) {

    this._uploadFiles = [];

    this.dom = {
      $el: null,
      $elWrap: null,
      $elInnerTitle: null,
      $elAlertsWrap: null,
      $loadedImagesWrap: null,
      $submitForm: null,
      $submitBtn: null,
      $fileInput: null,
      $container: null,
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
      maxSize: options.maxSize || 1,
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
        selectPhoto: "Выберите фото"
      },
      err: {
        default: "Произошла ошибка",
        fileTypeNotAllowed: "Можно загрузить только фото",
        fileTypeNotSupported: `Формат файла не подходит, только: "${Array.from(this._options.allowedTypes).join(", ")}"`,
        maxFiles: "Максимальное к-во элементов: " + this._options.maxSize,
        dublicateFile: "Файл уже загружен"
      }
    };

    this.dom.$container = document.querySelector(createWrap);
    this.customFields = this._getCustomFields();
    this._init();
  }


  _init() {
    try {
      if (!this.dom.$container) {
        throw new Error("Container element not found");
      }

      this._addToDOM();
      this._initDOMelements();
      this._addCustomFields();
      this._addEventHandlers();
    } catch (err) {
      console.error(err.message);
    }
  }


  _addToDOM() {
    this.dom.$container.innerHTML += this._getHtml();
  }


  _addCustomFields() {
    if (!this.customFields) return;

    for (const item of this.customFields) {
      if (item.classList.contains("dnd")) continue;

      this.dom.$submitForm.append(item);
    }
  }


  _getCustomFields() {
    if (this.dom.$container.children.length <= 0) return null;

    return this.dom.$container.children;
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
    this.changeState("active");
  }

  // leave
  _dragLeaveHandler(e) {
    e.preventDefault();
    this.changeState("default");
  }

  // over
  _dragOverHandler(e) {
    e.preventDefault();
  }

  // drop
  _dragDropHandler(e) {
    e.preventDefault();
    const _files = e.dataTransfer.files;

    this._allowedFilter(_files);
    this._multipleValidate();
    this._removeDublicateFile();
    this._moveFilesToPreview();
  }
  // # event handlers ======


  _removeDublicateFile() {
    const availablePreviews = document.querySelectorAll('.dnd__upload_img');

    if (this._uploadFiles.length <= 0) return false;

    this._uploadFiles = this._uploadFiles.filter((obj, index, arr) => {
      if (arr.findIndex((o) => o.name === obj.name) === index) {
        const removeEl = Array.from(availablePreviews).find(item => {
          const prevTitle = item.querySelector('.dnd__upload_img_title').textContent.trim();

          if (prevTitle == obj.name) {
            return true;
          }

          return false;
        });

        if(removeEl) removeEl.remove();

        return true;
      }

      this.showAlert(this.__.err.dublicateFile);
      return false;
    });
  }


  _moveFilesToPreview() {
    if (this._uploadFiles.length > 0) {
      for (const file of this._uploadFiles) {
        const previewEl = this._getUploadImg(file);
        this.dom.$loadedImagesWrap.append(previewEl);
      }
    }
  }


  _getUploadImg(file) {
    const fileUrl = URL.createObjectURL(file);
    const newUploadItem = document.createElement("div");

    newUploadItem.classList.add("dnd__upload_img");
    newUploadItem.innerHTML = `
      <div class="dnd__upload_img_wrap">
          <img src="${fileUrl}" alt="upload image">
          <button class="dnd__upload_img_delete_btn" title="удалить">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                  <path
                      d="m432 32h-120l-9.4-18.7a24 24 0 0 0 -21.5-13.3h-114.3a23.72 23.72 0 0 0 -21.4 13.3l-9.4 18.7h-120a16 16 0 0 0 -16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0 -16-16zm-378.8 435a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45l21.2-339h-384z" />
              </svg>
          </button>
      </div>
      <div class="dnd__upload_img_title">${file.name}</div>
    `;

    return newUploadItem;
  }


  _allowedFilter(_files) {
    for (const key in _files) {
      if (Object.hasOwnProperty.call(_files, key)) {
        const file = _files[key];

        if (this._isAllowedFile(file)) {
          this._uploadFiles.push(file);
        }
      }
    }
  }


  _isAllowedFile(file) {
    const _resultCheckFile = this._checkAllowedFile(file);

    if (_resultCheckFile.status) {
      return true;
    } else {
      this.showAlert(_resultCheckFile.errMsg || this.__.err.default, _resultCheckFile.errType);
      this.changeState("default");
      return false;
    }
  }


  _initDOMelements() {
    this.dom.$el = this.dom.$container.querySelector('.dnd');
    this.dom.$elWrap = this.dom.$container.querySelector('.dnd__wrap');
    this.dom.$elInnerTitle = this.dom.$container.querySelector('.dnd__title');
    this.dom.$elAlertsWrap = this.dom.$container.querySelector('.dnd__alerts_wrap');
    this.dom.$loadedImagesWrap = this.dom.$container.querySelector('.dnd__upload_images');
    this.dom.$submitForm = this.dom.$container.querySelector('.dnd__form');
    this.dom.$submitBtn = this.dom.$container.querySelector('.dnd__submit_btn');
    this.dom.$fileInput = this.dom.$container.querySelector('.dnd__file_input');

    for (const key in this.dom) {
      if (Object.hasOwnProperty.call(this.dom, key)) {
        const el = this.dom[key];

        if (el === null) throw new Error(`required DOM element not found | element: ${key}`);
      }
    }
  }


  _multipleValidate() {
    if (!this._options.multiple) {
      const _lastEl = this._uploadFiles[this._uploadFiles.length - 1];
      this._uploadFiles = [_lastEl];
      return;
    }

    while (true) {
      if (this._uploadFiles.length <= this._options.maxSize) {
        break;
      }

      this.showAlert(this.__.err.maxFiles);
      this._uploadFiles.shift();
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
          <div class="dnd__alerts_wrap"></div>

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
  changeTitle(newTxt = this.__.title.default) {
    this.dom.$elInnerTitle.textContent = newTxt;
  }

  showAlert(msg = "", type = "warning", timeToShow = 3500) {
    const $availableAlerts = document.querySelectorAll('.dnd__alert');

    if ($availableAlerts) {
      for (const item of $availableAlerts) {
        if (item.textContent == msg && item.getAttribute("data-type") == type) {
          return;
        }
      }
    }

    const _alert = document.createElement("div");
    _alert.setAttribute("data-type", type);
    _alert.classList.add("dnd__alert");
    _alert.textContent = msg;
    this.dom.$elAlertsWrap.append(_alert);

    setTimeout(() => _alert.remove(), timeToShow);
  }

  changeState(state) {
    switch (state) {
      case "active":
        this.changeTitle(this.__.title.drop);
        this.dom.$el.classList.add("active");
        break;
      case "default":
      default:
        this.changeTitle(this.__.title.default);
        this.dom.$el.classList.remove("active");
    }
  }
  // #helpers  =========
}


const dragNdrop = new DND("#dragdrop", {
  actionPath: "heheheh",
  allowedTypes: ["png", "jpg", "jpeg"],
  multiple: true,
  maxSize: 2
});