var app = getApp();
var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');
var user = require('../../../services/user.js');
Page({
  data: {
    desc: '',
    title: '',
    price: '',
    marketPrice: '',
    isPostageFree: false,
    postage: null,
    ableSelfTake: false,
    ableMeet: false,
    ableExpress: false,
    imgList: [],
    tmpImgList:[],
    categoryList: [],
    currentCategory: {},
    selectCategoryList: [
      { id: 0, name: '大类', parent_id: 0},
      { id: 0, name: '细分种类', parent_id: 1},
    ],
    selectCategoryDone: false,
    openSelectCategory: false,
  },
  onLoad: function(options) {
    var that = this;
    user.checkLoginAndNav()
  },
  onClose() {
    wx.navigateBack({
      delta: 1
    });
  },
  addImage() {
    let that = this;
    let remain = 10 - this.data.imgList.length;
    console.log('上传图片')
    wx.chooseImage({
      count: remain,
      success(res) {
        let length = res.tempFiles.length

        // tempFilePath可以作为img标签的src属性显示图片        
        let tempFilePaths = res.tempFilePaths
        let tempFiles = res.tempFiles
        that.setData({
          tmpImgList: that.data.tmpImgList.concat(tempFilePaths)
        })
        for (var i = 0; i < length; i++) {
          that.data.imgList.push('false');
          var index = that.data.imgList.length-1
          that.setData({
            imgList: that.data.imgList
          })
          
          if (tempFiles[i].size > 4500000) {
            console.log("图片太大")
            that.compressImg(tempFilePaths[i], index)
          } else {
            console.log("上传到图床")
            that.uploadFile(tempFilePaths[i], index)
          }

          // console.log(tempFilePaths[i]);

        }
        console.log(that.data.imgList);

      },
      fail(res) {
        console.log(res);
      },

    })
  },
  uploadFile(url, i) {
    let that = this;
    wx.uploadFile({
      url: 'https://81.71.134.143/api/upload/upload',
      filePath: url,
      name: url,
      success(res) {
        const data = JSON.parse(res.data);

        console.log(data)
        if (data.code == 'success') {
          console.log("图片上传成功, " + data.data.url)
          that.data.imgList[i] = data.data.url
          that.setData({
            imgList: that.data.imgList
          })
          // that.onLoad();

        } else if (data.code == 'error' && data.msg == 'File is too large.') {
          console.log("上传失败,图片太大")
          that.compressImg(url, i)
        }
      }
    })

    //模拟上传
    // setTimeout(function goback() {
    //   console.log("图片上传成功, " + url)
    //   that.data.imgList[i] = url
    //   that.setData({
    //     imgList: that.data.imgList
    //   })
    // }, 2000)

  },
  compressImg(url, i) {
    let that = this
    wx.compressImage({
      src: url, // 图片路径
      quality: 50, // 压缩质量
      success() {
        console.log("压缩后重新上传")
        that.uploadFile(url, i)
      },
      fail(res) {
        console.log(res)
        console.log("压缩失败 ")
      }
    })
  },
  removeImg(event){
    console.log("删除元素")
    let index = event.currentTarget.dataset.index
    let that = this
    that.data.imgList.splice(index, 1)
    that.data.tmpImgList.splice(index, 1)
    this.setData({
      imgList: that.data.imgList ,
      tmpImgList: that.data.tmpImgList,
    })

  },
  preview(event){
    let url = event.currentTarget.dataset.url
    let urls = [];
    let imgList = this.data.imgList
    for (var index in imgList){
      if (imgList[index]!='false'){
        urls.push(imgList[index])
      }
    }
    wx.previewImage({
      current: url,
      urls: urls // 需要预览的图片http链接列表
    })
  },
  onPost() {
    
    if (this.data.title.trim() == '') {
      util.showErrorToast('必须填写商品名')
      return;
    }

    if (this.data.desc.trim() == '') {
      util.showErrorToast('必须填写介绍')
      return;
    }
    if (this.data.imgList.length < 1) {
      util.showErrorToast('请上传图片')
      return;
    }
    if (this.data.cateName.trim() == '') {
      util.showErrorToast('请选择分类')
      return;
    }

    let reg1 = /^[0-9]+(.[0-9]{1,})?$/;
    let reg2 = /^[0-9]+(.[0-9]{1,2})?$/;

    if (this.data.price == '') {
      util.showErrorToast('必须填写价格')
      return;
    }

    let postage = this.data.postage == null ? '0.00' : this.data.postage
    this.setData({
      marketPrice: this.data.marketPrice == '' ? '0' : this.data.marketPrice
    })

    if (!reg1.test(this.data.price) || !reg1.test(this.data.marketPrice) || !reg1.test(postage)) {
      util.showErrorToast('价格必须是数字')
      return;
    }
    if (!reg2.test(this.data.price) || !reg2.test(this.data.marketPrice) || !reg2.test(postage)) {
      util.showErrorToast('小数必须是最大2位')
      return;
    }
    if (parseFloat(this.data.price) >= 100000000 || parseFloat(this.data.marketPrice) >= 100000000) {
      util.showErrorToast("必须在0到1亿元之间")
      return;
    }
    if (parseFloat(postage) > 1000) {
      util.showErrorToast("邮费最大1千元")
      return;
    }
    if (!this.data.ableSelfTake && !this.data.ableMeet && !this.data.ableExpress) {
      util.showErrorToast("请选择交易方式")
      return;
    }

    let imgList = this.data.imgList
    for (var index in imgList) {
      if (imgList[index] == 'false') {
        util.showErrorToast('图片上传中')
        return;
      }
    }

    let that = this
    user.checkLoginAndNav().then(() => {
      util.request(api.GoodsPost, {
        name: this.data.title,
        desc: this.data.desc,
        price: this.data.price,
        marketPrice: this.data.marketPrice,
        postage: postage,
        ableSelfTake: this.data.ableSelfTake,
        ableMeet: this.data.ableMeet,
        ableExpress: this.data.ableExpress,
        images: this.data.imgList,
      }, 'POST').then(function(res) {
        if (res.errno === 0) {

          setTimeout(function goback() {
            wx.reLaunch({
              url: '/pages/index/index'
            })
          }, 1000)

          wx.showToast({
            title: '发布成功'
          })
        }

        console.log(res)
      });
    })

  },
  getCategory: function () {
    //CatalogList
    let that = this;
    wx.showLoading({
      title: '加载中...',
    });
    util.request(api.CatalogList).then(function (res) {
        that.setData({
           categoryList: res.data.categoryList,
           currentCategory: res.data.currentCategory
        });
        wx.hideLoading();
      });
  },
  getCurrentCategory: function (id) {
    let that = this;
        util.request(api.CatalogCurrent, { id: id })
        .then(function (res) {
          that.setData({
            currentCategory: res.data.currentCategory
          });
        });
  },
   getList: function () {
      var that = this;
      util.request(api.ApiRootUrl + 'api/catalog/' + that.data.currentCategory.cat_id)
        .then(function (res) {
          that.setData({
            categoryList: res.data,
          });
        });
    },
    setCategoryDoneStatus() {
      let that = this;
      let doneStatus = that.data.selectCategoryList.every(item => {
        return item.id != 0;
      });
  
      that.setData({
        selectCategoryDone: doneStatus
      })
  
    },
  chooseCategory() {
    let that = this;
    this.getCategory();
    this.setData({
      openSelectCategory: !this.data.openSelectCategory
    });

    this.setData({
      selectCategoryList: [
          { id: 0, name: '大类', parent_id: 0},
          { id: 0, name: '细分种类', parent_id: 1},
        ],
      })

    this.setCategoryDoneStatus();
  },
  selectCategory(event) {
    let that = this;
    let levelIndex = event.target.dataset.index;

    let curCate = this.data.categoryList[levelIndex]
    var index = 0
    if(curCate.parent_id != 0) {
      index = 1
    }

    let selectCategoryList = this.data.selectCategoryList
    selectCategoryList[index].id = curCate.id
    selectCategoryList[index].name = curCate.name
    selectCategoryList[index].parent_id = curCate.parent_id

    this.setData({
      selectCategoryList: selectCategoryList
    })

    console.log(this.data.selectCategoryList)
    this.getCurrentCategory(curCate.id)
    this.setData({
      categoryList: this.data.currentCategory.subCategoryList
    })
/*
    this.getCurrentCategory(selectCategory[0].id)

    let categoryItem = this.data.categoryList[levelIndex];
    let cateLevel = categoryItem.id == 0 ? 1 : 2;
    let selectCategoryList = this.data.selectCategoryList;
    selectCategoryList[cateLevel - 1] = categoryItem;


    if (cateLevel != 2) {
      this.setData({
        selectCategoryList: selectCategoryList,
        cateLevel: cateLevel + 1
      })
      this.getCurrentCategory(categoryItem.id);
    } else {
      this.setData({
        selectCategoryList: selectCategoryList
      })
    }

    //重置下级区域为空
    selectCategoryList.map((item, index) => {
      if (index > cateLevel - 1) {
        item.id = 0;
        item.name = '细分种类';
        item.parent_id = 0;
      }
      return item;
    });

    this.setData({
      selectCategoryList: selectCategoryList
    })


    that.setData({
      categoryList: that.data.categoryList.map(item => {

        //标记已选择的
        if (that.data.cateLevel == cateLevel && that.data.selectCategoryList[that.data.cateLevel - 1].id == item.id) {
          item.selected = true;
        } else {
          item.selected = false;
        }

        return item;
      })
    });

    this.setRegionDoneStatus();
*/
  },
  selectCategoryLevel(event) {
    let that = this;
    let cateLevelIndex = event.target.dataset.index;
    let selectCategoryList = that.data.selectCategoryList;

    //判断是否可点击
    if (cateLevelIndex - 1 >= 0 && selectCategoryList[cateLevelIndex-1].id <= 0) {
      return false;
    }
    
    let selectCategoryItem = selectCategoryList[cateLevelIndex];
    this.getCategory()
  },
  bindInputDesc(event) {
    this.setData({
      desc: event.detail.value,
    })
    console.log(event.detail)
  },
  bindInputTitle(event) {
    this.setData({
      title: event.detail.value,
    })
    console.log(event.detail)
  },
  bindInputPrice(event) {
    this.setData({
      price: event.detail.value,
    })
    console.log(event.detail)

  },
  bindInputMarketPrice(event) {
    this.setData({
      marketPrice: event.detail.value,
    })
  },
  bindInputPostage(event) {
    this.setData({
      postage: event.detail.value,
    })
  },
  postageFree(event) {
    if (event.detail.value[0]) {
      this.setData({
        isPostageFree: true,
        postage: null
      })
    } else {
      this.setData({
        isPostageFree: false,

      })
    }
    console.log(event.detail.value[0])
  },
  trade(event) {
    this.setData({
      ableSelfTake: false,
      ableMeet: false,
      ableExpress: false,
    })
    for (let i in event.detail.value) {
      console.log(event.detail.value[i])
      if (event.detail.value[i] == 'ableSelfTake') {
        this.setData({
          ableSelfTake: true,
        })
      } else if (event.detail.value[i] == 'ableMeet') {
        this.setData({
          ableMeet: true,
        })
      } else if (event.detail.value[i] == 'ableExpress') {
        this.setData({
          ableExpress: true,
        })
      }
    };

    console.log(event.detail)
  },
  onReady: function() {

  },
  onShow: function() {
    // 页面显示
  },
  onHide: function() {
    // 页面隐藏

  },
  onUnload: function() {
    // 页面关闭
    //重启
    wx.reLaunch({
      url: '/pages/index/index'
    })


  }
})