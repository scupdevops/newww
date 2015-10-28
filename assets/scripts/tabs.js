module.exports = function() {
  if (!("querySelectorAll" in document)) {
    return;
  }
  var className = ".tab";

  var Tab = function(element, opts) {
    opts = opts || {};

    this.element = element;
    this.$element = $(element);
    this.tabNav = $(".tabs [href='#" + element.id + "']");
    this.isOpen = false;
    this.siblings = $(className).not(this.$element);
    this.$element.data("tab", this);

    this.init();
  };

  Tab.prototype.init = function() {
    if (this.tabNav.closest("li").hasClass("current")) {
      this.open();
    } else {
      this.close();
    }
  };

  Tab.prototype.open = function() {
    this.$element.removeClass("hidden");
    this.$element.addClass("visible");
    this.isOpen = true;
    $(".tabs .current").removeClass("current");
    this.tabNav.closest("li").addClass("current");

    $.each(this.siblings, function(idx, el) {
      var tab = $(el).data("tab");
      if (tab) {
        tab.close();
      }
    });
  };

  Tab.prototype.close = function() {
    this.$element.removeClass("visible");
    this.$element.addClass("hidden");
    this.isOpen = false;
  };

  Tab.prototype.toggle = function() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  var openLinkedTab = function() {
    if ($(".tabs .current").attr("href") !== location.hash) {
      var tab = $(location.hash).data('tab');
      tab && tab.open();
    }
  };

  var parser = document.createElement("a");

  var updateFormActions = function() {
    var forms = document.querySelectorAll("form");
    for (var i = 0, l = forms.length; i < l; i++) {
      var form = forms[i];
      parser.href = form.action;
      form.action = parser.pathname + location.hash;
    }
  };

  $(function() {
    $(window)[0].scrollTo(0, 0);


    var tabs = $(className);
    $.each(tabs, function(idx, el) {
      var tab = new Tab(el);

      tab.tabNav.on("click", function(e) {
        e.preventDefault();
        tab.open();
        location.hash = $(this).attr('href');
        $(window)[0].scrollTo(0, 0);
      });
    });


    openLinkedTab();
    updateFormActions();

    $(window).on("hashchange", function(e) {
      openLinkedTab();
      updateFormActions();
    });

  });


};
