define(['backbone', 'text!templates/rankings.html'],
function(backbone,   rankingsTemplate)
{


return Backbone.View.extend({
  el: _.template(rankingsTemplate),

  events: {
  },

  initialize: function(options) {
    this.options = _.extend({
    }, options || {})

  
    this.$rankings = this.$('.ranking-list')

    $.get("/board/championship", _.bind(this.onReset, this));
  },


  onReset: function(rankings, status, xhr) {
    console.log("reset", rankings)

    var tmpl = _.template('<tr>'+
                           '<td class="rank">#<%= rank %></td>'+
                           '<td class="score"><%= score %></td>'+
                           '<td class="scriptName"><button class="btn btn-link openScript"><%= script.scriptName %></button></td>'+
                           '<td class="username"><%= username %></td>'+
                          '</tr>');

    for (var i=0; i < rankings.length; i++) {

      (_.bind(function() {


        var ranking = rankings[i];
        ranking.rank = i+1;
        var $row = $(tmpl(ranking));

        $row.find('.openScript').click(_.bind(function() {
          this.trigger("codewars:openScript", ranking.script);
        }, this));

        this.$rankings.append($row)

      }, this))();
    }
  },



});


});
