class DND {
  static _id = 0;

  constructor(createWrap = ".dnd_el", options) {
    this.id = ++DND._id;
    this._uploadFiles = [];

    this.dom = {
      $el: null,
      $elWrap: null,
      $elInnerTitle: null,
      $elAlertsWrap: null,
      $elLoadInput: null,
      $elLoadInputWrap: null,
      $loadedImagesWrap: null,
      $submitForm: null,
      $submitBtn: null,
      $fileInput: null,
      $container: null,
    };

    this._eHandlers = {
      deleteFile: this._deleteFileHandler.bind(this),
      dragenter: this._dragEnterHandler.bind(this),
      dragleave: this._dragLeaveHandler.bind(this),
      dragover: this._dragOverHandler.bind(this),
      drop: this._dragDropHandler.bind(this),
      loadFile: this._loadInputHandler.bind(this),
      submitForm: this._toSubmitFormHandler.bind(this)
    };

    this._options = {
      containerSelector: createWrap,
      actionPath: options.actionPath || "#",
      multiple: options.multiple || false,
      maxFiles: options.maxFiles || 1,
      allowedTypes: options.allowedTypes || "*",
      theme: options.theme || "light",
      onlyImage: options.onlyImage || false,
      width: options.width || "md",
      height: options.height || "md",
      size: options.size || "md",
    };

    if ("customize" in options) {
      for (const key in options.customize) {
        if (Object.hasOwnProperty.call(options.customize, key)) {
          const element = options.customize[key];

          this._options[key] = element;
        }
      }
    }

    if ("showFileName" in options) {
      this._options.showFileName = options.showFileName;
    }

    if ("size" in options) {
      this._options.width = options.width;
      this._options.height = options.height;
    }

    if ("bannedTypes" in options) {
      this._options.bannedTypes = options.bannedTypes;
    }

    this._addActionPath(createWrap);

    this.__ = {
      saveBtnTxt: "Сохранить",
      loadBtnTxt: `Выберите файл${this._options.multiple ? "ы" : ""}`,
      title: {
        default: `Перетащите файл${this._options.multiple ? "ы" : ""} сюда`,
        drop: "Отпустите файл",
      },
      alertTxt: {
        selectPhoto: "Выберите файлы для загрузки"
      },
      err: {
        default: "Произошла ошибка",
        fileTypeNotAllowed: "Можно загрузить только фото",
        fileTypeNotSupported: `Доступные форматы: "${Array.from(this._options.allowedTypes).join(", ")}"`,
        thisFileTypeNotSupported: "Этот формат не допустим",
        maxFiles: "Максимальное к-во элементов: " + this._options.maxFiles,
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


  _addActionPath(createWrap) {
    try {
      const $createWrap = document.querySelector(createWrap);

      if (!$createWrap) {
        throw new Error("Container element not found");
      }

      if ($createWrap.hasAttribute("data-action-path")) {
        this._options.actionPath = $createWrap.getAttribute("data-action-path");
        $createWrap.removeAttribute("data-action-path");
      }
    } catch (err) {
      console.error(err.message)
    }
  }


  _toSubmitFormHandler() {
    if (this._uploadFiles.length <= 0) {
      this.showAlert(this.__.alertTxt.selectPhoto);
      return;
    }

    const dt = new DataTransfer();
    let fileList;

    for (const file of this._uploadFiles) {
      dt.items.add(file);
    }

    fileList = dt.files;
    this.dom.$fileInput.files = fileList;
    this.dom.$submitForm.submit();
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
    this.dom.$elLoadInput.addEventListener("change", this._eHandlers.loadFile);
    this.dom.$submitBtn.addEventListener("click", this._eHandlers.submitForm);
    this.dom.$elWrap.addEventListener("drop", this._eHandlers.drop);
  }

  // event handlers  ======

  // load input file
  _loadInputHandler(e) {
    this._loadNewFile(e.target.files);
    this.dom.$elLoadInput.value = "";
  }

  // delete file
  _deleteFileHandler(e) {
    const dummy = {};
    const eT = e.target;
    const deletePreview = eT.closest(".dnd__upload_file");

    if (!deletePreview) return;

    let deleteFileName = (deletePreview.querySelector(".dnd__upload_file_title") || dummy).textContent;
    deleteFileName = deleteFileName ? deleteFileName.trim() : "";

    const deleteElemIndex = this._uploadFiles.findIndex(item => item.name == deleteFileName);

    this._uploadFiles.splice(deleteElemIndex, 1);
    deletePreview.remove();

    this.checkEmptyDND();
  }

  // enter
  _dragEnterHandler(e) {
    e.preventDefault();
    this.changeState("active");
  }

  // leave
  _dragLeaveHandler(e) {
    e.preventDefault();
    this.changeState("default");
    this.checkEmptyDND();
  }

  // over
  _dragOverHandler(e) {
    e.preventDefault();
    this.changeState("over");
  }

  // drop
  _dragDropHandler(e) {
    e.preventDefault();

    this._loadNewFile(e.dataTransfer.files);
  }
  // # event handlers ======


  _loadNewFile(_files) {
    this.changeState("default");

    this._allowedFilter(_files);
    this._multipleValidate();
    this._removeDublicateFile();
    this._moveFilesToPreview();

    this.checkEmptyDND();
  }


  _removeDublicateFile() {
    const dummy = {};
    const availablePreviews = document.querySelectorAll('.dnd__upload_file');

    if (this._uploadFiles.length <= 0) return false;

    this._uploadFiles = this._uploadFiles.filter((obj, index, arr) => {
      if (arr.findIndex((o) => (o || dummy).name === (obj || dummy).name) === index) {
        const removeEl = Array.from(availablePreviews).find(item => {
          const prevTitle = item.querySelector('.dnd__upload_file_title').textContent.trim();

          if (prevTitle == obj.name) {
            return true;
          }

          return false;
        });

        if (removeEl) removeEl.remove();

        return true;
      }

      this.showAlert(this.__.err.dublicateFile);
      return false;
    });
  }


  _moveFilesToPreview() {
    if (this._uploadFiles.length > 0) {

      for (let index = 0; index < this._uploadFiles.length; index++) {
        const file = this._uploadFiles[index];

        if (!file) {
          this._uploadFiles.splice(index, 1);
          return;
        }

        const previewEl = this._getUploadImg(file);
        this._addDeleteBtnHandler(previewEl);
        this.dom.$loadedImagesWrap.append(previewEl);
      }
    }
  }


  _addDeleteBtnHandler(el) {
    if (el) {
      const $deleteBtn = el.querySelector(".dnd__upload_file_delete_btn");

      $deleteBtn.addEventListener("click", this._eHandlers.deleteFile);
    }
  }


  _getUploadImg(file) {
    if (!(file instanceof File)) return;

    let isImage = file.type.startsWith("image/") ? true : false;

    const fileUrl = URL.createObjectURL(file);
    const newUploadItem = document.createElement("div");

    if (!isImage) newUploadItem.setAttribute("data-default", "");

    newUploadItem.classList.add("dnd__upload_file");
    newUploadItem.innerHTML = `
      <div class="dnd__upload_file_wrap">
          ${isImage ? `<img src="${fileUrl}" alt="upload image">` : ""}
          <div class="dnd__upload_file_empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850.149 1045.38"><path d="M685.853 524.23H164.296v-68.266h521.557zm0 173.398H164.296V629.36h521.557zm0 173.853H164.296v-68.266h521.557zM0 21.334h613.08L850.15 258.4v786.933H0zM584.774 89.6H68.267v887.467H781.88V286.71zM850.15 350.378H521.103V21.333h91.978L850.15 258.4zm-260.78-68.266h187.915L589.37 94.197z"/></svg>
          </div>
          <button class="dnd__upload_file_delete_btn" title="удалить">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                  <path
                      d="m432 32h-120l-9.4-18.7a24 24 0 0 0 -21.5-13.3h-114.3a23.72 23.72 0 0 0 -21.4 13.3l-9.4 18.7h-120a16 16 0 0 0 -16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0 -16-16zm-378.8 435a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45l21.2-339h-384z" />
              </svg>
          </button>
      </div>
      <div class="dnd__upload_file_title">${file.name}</div>
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
      return false;
    }
  }


  _initDOMelements() {
    this.dom.$el = this.dom.$container.querySelector('.dnd');
    this.dom.$elWrap = this.dom.$container.querySelector('.dnd__wrap');
    this.dom.$elLoadInput = this.dom.$container.querySelector(".dnd__file");
    this.dom.$elLoadInputWrap = this.dom.$container.querySelector(".dnd__file_wrap");
    this.dom.$elInnerTitle = this.dom.$container.querySelector('.dnd__title');
    this.dom.$elAlertsWrap = this.dom.$container.querySelector('.dnd__alerts_wrap');
    this.dom.$loadedImagesWrap = this.dom.$container.querySelector('.dnd__upload_files');
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
      const availablePreviews = document.querySelectorAll('.dnd__upload_file');
      const _lastEl = this._uploadFiles[this._uploadFiles.length - 1];
      this._uploadFiles = [_lastEl];

      if (availablePreviews && availablePreviews.length > 0) {
        availablePreviews.forEach(item => item.remove());
      }

      return;
    }

    while (true) {
      if (this._uploadFiles.length <= this._options.maxFiles) {
        break;
      }

      this.showAlert(this.__.err.maxFiles);
      this._uploadFiles.pop();
    }
  }


  _checkAllowedFile(file) {
    try {
      if (file instanceof File) {
        if ("bannedTypes" in this._options) {
          if (this._options.onlyImage && !file.type.startsWith("image/")) return { errType: "danger", errMsg: this.__.err.fileTypeNotAllowed, status: false };

          const _type = file.type.replace(/^image\//, "");

          if (typeof this._options.bannedTypes == "string") {
            if (_type == this._options.bannedTypes) return { errType: "warning", errMsg: this.__.err.thisFileTypeNotSupported, status: false }
          } else if (Array.isArray(this._options.bannedTypes) && this._options.bannedTypes.includes(_type)) {
            return { errType: "warning", errMsg: this.__.err.thisFileTypeNotSupported, status: false };
          }
        }

        if (typeof (this._options.allowedTypes) === "string") {
          if (this._options.allowedTypes === "*") {
            return { status: true };
          }

          return { errType: "danger", errMsg: this.__.err.fileTypeNotAllowed, status: false };
        } else if (Array.isArray(this._options.allowedTypes)) {

          if (this._options.onlyImage && !file.type.startsWith("image/")) return { errType: "danger", errMsg: this.__.err.fileTypeNotAllowed, status: false };

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
    <div class="dnd"
      data-theme="${this._options.theme}"
      data-width="${this._options.width}"
      data-height="${this._options.height}"
      data-size="${this._options.size}"
    >
        <div class="dnd__wrap">
            <div class="dnd__offer">
                <svg class="dnd__offer_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                        d="m21 16c.5128358 0 .9355072.3860402.9932723.8833789l.0067277.1166211v2c0 1.5976809-1.24892 2.9036609-2.8237272 2.9949073l-.1762728.0050927h-14c-1.59768088 0-2.90366088-1.24892-2.99490731-2.8237272l-.00509269-.1762728v-2c0-.5522847.44771525-1 1-1 .51283584 0 .93550716.3860402.99327227.8833789l.00672773.1166211v2c0 .5128358.38604019.9355072.88337887.9932723l.11662113.0067277h14c.5128358 0 .9355072-.3860402.9932723-.8833789l.0067277-.1166211v-2c0-.5522847.4477153-1 1-1zm-9-14c.5522847 0 1 .44771525 1 1v9.585l1.2928932-1.2921068c.360484-.3604839.927715-.3882135 1.3200062-.0831886l.0942074.0831886c.3604839.360484.3882135.927715.0831886 1.3200062l-.0831886.0942074-3 3-.0439598.0413974-.0678404.0551612-.1112445.0716634-.1127261.0534457-.105343.0353804-.1485188.0290109-.1174742.0068342-.0752385-.0027879-.1254873-.0174522-.1114167-.029498-.111079-.0439353-.0974873-.0523221-.0960413-.0667905c-.0317158-.0248828-.0618904-.0516409-.0903567-.0801072l-2.99999998-3c-.39052429-.3905243-.39052429-1.0236893 0-1.4142136.36048396-.3604839.92771502-.3882135 1.32000622-.0831886l.09420734.0831886 1.29289322 1.2921068v-9.585c0-.55228475.4477153-1 1-1z"
                        fill-rule="evenodd" />
                </svg>
                <div class="dnd__title">${this.__.title.default}</div>
                <span>или</span>
            </div>
            <div class="dnd__file_wrap">
              <label for="dnd__file_${this.id}" class="dnd__file_label">
                <svg class="dnd__file_label_icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" ><g clip-rule="evenodd" fill="#333" fill-rule="evenodd"><path d="m24 42c9.9411 0 18-8.0589 18-18s-8.0589-18-18-18-18 8.0589-18 18 8.0589 18 18 18zm0 2c11.0457 0 20-8.9543 20-20s-8.9543-20-20-20-20 8.9543-20 20 8.9543 20 20 20z"/><path d="m13 24c0-.5523.4477-1 1-1h20c.5523 0 1 .4477 1 1s-.4477 1-1 1h-20c-.5523 0-1-.4477-1-1z"/><path d="m24 13c.5523 0 1 .4477 1 1v20c0 .5523-.4477 1-1 1s-1-.4477-1-1v-20c0-.5523.4477-1 1-1z"/></g></svg>
                <span>${this.__.loadBtnTxt}</span>
              </label>
              <input class="dnd__file" hidden type="file" id="dnd__file_${this.id}" ${this._options.onlyImage ? "accept='image/*'" : ""} ${this._options.multiple ? "multiple" : ""} />
            </div>

            <div class="dnd__alerts_wrap"></div>
            <div class="dnd__upload_files"></div>
        </div>

        <button hidden class="dnd__submit_btn">${this.__.saveBtnTxt}</button>

        <form hidden class="dnd__form" action="${this._options.actionPath}" method="POST" enctype="multipart/form-data">
            <input type="file" name="files[]" class="dnd__file_input" ${this._options.multiple ? "multiple" : ""} />
        </form>

        <style>
          ${this._options.containerSelector} {
            .dnd {
              ::-webkit-scrollbar {
                ${this._options.dropzoneScroll ? "background:" + this._options.dropzoneScroll + ";" : ""};
              }

              ::-webkit-scrollbar-thumb {
                ${this._options.dropzoneScrollThumb ? "background:" + this._options.dropzoneScrollThumb + ";" : ""};
              }
            }
            .dnd__wrap {
              ${this._options.dropzone ? "background:" + this._options.dropzone + ";" : ""};
              ${this._options.dropzoneBorder ? "border-color:" + this._options.dropzoneBorder + ";" : ""};
            }

            .dnd.over .dnd__wrap {
              ${this._options.dropzoneHover ? "background:" + this._options.dropzoneHover + ";" : ""};
            }

            .dnd__file_label {
              ${this._options.loadBtn ? "background:" + this._options.loadBtn + ";" : ""};
              ${this._options.loadBtnText ? "color:" + this._options.loadBtnText + ";" : ""};
              ${this._options.loadBtnBorder ? "border-color:" + this._options.loadBtnBorder + ";" : ""};
            }

            .dnd__file_label:hover {
              ${this._options.loadBtnHover ? "background:" + this._options.loadBtnHover + ";" : ""};
            }

            .dnd__offer {
              .dnd__offer_icon path {
                ${this._options.dropzoneIcon ? "fill:" + this._options.dropzoneIcon + ";" : ""};
              }

              .dnd__title, span {
                ${this._options.dropzoneTitle ? "color:" + this._options.dropzoneTitle + ";" : ""};
              }
            }

            .dnd__submit_btn {
              ${this._options.submitBtnText ? "color:" + this._options.submitBtnText + ";" : ""};
              ${this._options.submitBtn ? "background:" + this._options.submitBtn + ";" : ""};
              ${this._options.submitBtnBorder ? "border-color:" + this._options.submitBtnBorder + ";" : ""};
            }

            .dnd__submit_btn:hover {
              ${this._options.submitBtnHover ? "background:" + this._options.submitBtnHover + ";" : ""};
            }

            .dnd__file_wrap.compact .dnd__file_label_icon path {
              ${this._options.loadBtnCompact ? "fill:" + this._options.loadBtnCompact + ";" : ""};
            }

            .dnd__file_wrap.compact {
              ${this._options.loadBtnCompactBg ? "background:" + this._options.loadBtnCompactBg + ";" : ""};
            }

            .dnd__file_wrap.compact .dnd__file_label_icon:hover path {
              ${this._options.loadBtnCompactHover ? "fill:" + this._options.loadBtnCompactHover + ";" : ""};
            }

            .dnd__upload_file[data-default] .dnd__upload_file_wrap {
              ${this._options.defaultPreview ? "background:" + this._options.defaultPreview + ";" : ""};
              ${this._options.defaultPreviewBorder ? "border-color:" + this._options.defaultPreviewBorder + ";" : ""};
            }

            .dnd__upload_file[data-default] .dnd__upload_file_empty path {
              ${this._options.defaultPreviewIcon ? "fill:" + this._options.defaultPreviewIcon + ";" : ""};
            }

            .dnd__upload_file_title {
              ${this._options.previewFileName ? "color:" + this._options.previewFileName + ";" : ""};
            }

            .dnd__upload_file_title {
              ${this._options.showFileName ? "display: block;" : "display: none;"};
            }
          }
        </style>
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
      case "filled":
        this.dom.$el.classList.add("filled");
        break;
      case "over":
        this.changeTitle(this.__.title.drop);
        this.dom.$el.classList.add("over");
        break;
      case "default":
      default:
        this.changeTitle(this.__.title.default);
        this.dom.$el.classList.remove("active");
        this.dom.$el.classList.remove("filled");
        this.dom.$el.classList.remove("over");
    }
  }

  showSubmitBtn() {
    this.dom.$submitBtn.removeAttribute("hidden");
  }

  hiddenSubmitBtn() {
    this.dom.$submitBtn.setAttribute("hidden", "");
  }

  checkEmptyDND() {
    if (this._uploadFiles.length > 0) {
      this.changeState("filled");
      this.showSubmitBtn();

      if (this._options.multiple && this._uploadFiles.length < this._options.maxFiles) {
        this.dom.$elLoadInputWrap.classList.add("compact");
        this.dom.$elLoadInputWrap.removeAttribute("hidden");
      } else {
        this.dom.$elLoadInputWrap.classList.remove("compact");
        this.dom.$elLoadInputWrap.setAttribute("hidden", "");
      }
    } else {
      this.dom.$elLoadInputWrap.classList.remove("compact");
      this.dom.$elLoadInputWrap.removeAttribute("hidden");
      this.changeState("default");
      this.hiddenSubmitBtn();
    }
  }
  // #helpers  =========
}


const dragNdrop = new DND("#dragdrop", {
  theme: "dark_g",
  onlyImage: false,
  multiple: false,
  maxFiles: 8,
  size: "md",
  showFileName: false
});

// customize: {
    // dropzone: "",
    // dropzoneHover: "",
    // dropzoneBorder: "",
    // dropzoneTitle: "",
    // dropzoneIcon: "",
    // dropzoneScroll: "",
    // dropzoneScrollThumb: "",

    // loadBtn: "",
    // loadBtnHover: "",
    // loadBtnText: "",
    // loadBtnBorder: "",

    // loadBtnCompact: "",
    // loadBtnCompactBg: "",
    // loadBtnCompactHover: "",

    // submitBtn: "",
    // submitBtnHover: "",
    // submitBtnBorder: "",
    // submitBtnText: "",

    // defaultPreview: "",
    // defaultPreviewBorder: "",
    // defaultPreviewIcon: "",
    // previewFileName: "",
  // }

